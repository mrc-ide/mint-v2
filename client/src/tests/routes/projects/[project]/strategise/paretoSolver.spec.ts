import {
	MAX_FRONTIER_SIZE,
	solveMultipleChoiceKnapsack,
	type KnapsackItem,
	thinFrontier
} from '$routes/projects/[project]/strategise/paretoSolver';
import { equalTo, lessEq, solve, type Constraint, type Model } from 'yalps';

// Deterministic PRNG so failures are reproducible
const createRandom = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return seed / 2147483647;
};

const createGroups = (random: () => number, regionCount: number): KnapsackItem[][] =>
	Array.from({ length: regionCount }, () => {
		const population = 10_000 + random() * 1_000_000;
		const interventionCount = 2 + Math.floor(random() * 7);
		return Array.from({ length: interventionCount }, () => ({
			cost: Math.round(population * random() * 10),
			value: population * random() * 0.3
		}));
	});

/** Reference solution using the integer programming solver the DP replaced. */
const solveWithYalps = (groups: KnapsackItem[][], threshold: number): number | null => {
	const constraints: Record<string, Constraint> = { cost: lessEq(threshold) };
	const variables: Record<string, Record<string, number>> = {};
	groups.forEach((items, g) => {
		constraints[`g${g}`] = equalTo(1);
		items.forEach((item, i) => {
			variables[`g${g}-${i}`] = { cost: item.cost, value: item.value, [`g${g}`]: 1 };
		});
	});
	const model: Model = { direction: 'maximize', objective: 'value', constraints, variables, binaries: true };
	const solution = solve(model);
	return solution.status === 'optimal' ? solution.result : null;
};

const totalOf = (groups: KnapsackItem[][], choices: number[], key: keyof KnapsackItem) =>
	choices.reduce((sum, choice, g) => sum + groups[g][choice][key], 0);

describe('solveMultipleChoiceKnapsack', () => {
	it('picks the best combination within each budget', () => {
		const groups = [
			[
				{ cost: 0, value: 0 },
				{ cost: 100, value: 50 },
				{ cost: 200, value: 100 }
			],
			[
				{ cost: 0, value: 0 },
				{ cost: 100, value: 80 },
				{ cost: 200, value: 90 }
			]
		];

		const result = solveMultipleChoiceKnapsack(groups, [0, 100, 200, 300, 400]);

		expect(result).toEqual([
			[0, 0],
			[0, 1],
			[1, 1],
			[2, 1],
			[2, 2]
		]);
	});

	it('returns null when no combination fits the budget', () => {
		const groups = [[{ cost: 100, value: 1 }], [{ cost: 50, value: 1 }]];

		expect(solveMultipleChoiceKnapsack(groups, [149, 150])).toEqual([null, [0, 0]]);
	});

	it('returns null for every threshold when a group has no items', () => {
		expect(solveMultipleChoiceKnapsack([[{ cost: 1, value: 1 }], []], [10, 20])).toEqual([null, null]);
	});

	it('accepts a combination costing exactly the threshold despite floating point error', () => {
		const groups = [[{ cost: 0.1, value: 1 }], [{ cost: 0.2, value: 1 }]];

		expect(solveMultipleChoiceKnapsack(groups, [0.3])).toEqual([[0, 0]]);
	});

	it('selects one intervention per region within budget for 100 regions', () => {
		const random = createRandom(42);
		const groups = createGroups(random, 100);
		const maxCost = groups.reduce((sum, items) => sum + Math.max(...items.map((i) => i.cost)), 0);

		const result = solveMultipleChoiceKnapsack(groups, [maxCost]);

		expect(result[0]).toHaveLength(100);
		expect(totalOf(groups, result[0]!, 'cost')).toBeLessThanOrEqual(maxCost);
	});

	// yalps is exponential in the number of regions, so only compare against it on small instances
	it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])('matches the yalps optimum for %i regions', (regionCount) => {
		const random = createRandom(regionCount * 7919);
		for (let instance = 0; instance < 5; instance++) {
			const groups = createGroups(random, regionCount);
			const minCost = groups.reduce((sum, items) => sum + Math.min(...items.map((i) => i.cost)), 0);
			const maxCost = groups.reduce((sum, items) => sum + Math.max(...items.map((i) => i.cost)), 0);
			// Include a threshold below the minimum cost to check infeasible budgets agree
			const thresholds = [
				minCost - 1,
				...Array.from({ length: 10 }, (_, i) => minCost + ((maxCost - minCost) * i) / 9)
			];

			const dpResults = solveMultipleChoiceKnapsack(groups, thresholds);

			thresholds.forEach((threshold, t) => {
				const expected = solveWithYalps(groups, threshold);
				const choices = dpResults[t];
				if (expected === null) {
					expect(choices).toBeNull();
					return;
				}
				expect(choices).not.toBeNull();
				expect(totalOf(groups, choices!, 'cost')).toBeLessThanOrEqual(threshold + 1e-6);
				expect(totalOf(groups, choices!, 'value')).toBeCloseTo(expected, 4);
			});
		}
	});
});

describe('thinFrontier', () => {
	/** Builds a frontier from ascending costs; each state records its own index so kept states can be traced. */
	const createFrontier = (costs: number[]) => ({
		costs: Float64Array.from(costs),
		values: Float64Array.from(costs, (cost) => cost * 2),
		previousStateIndices: Int32Array.from(costs, (_, i) => i),
		itemIndices: Int32Array.from(costs, (_, i) => i % 7)
	});

	it('returns the frontier unchanged when it is within the size cap', () => {
		const frontier = createFrontier([0, 1, 2, 3]);

		expect(thinFrontier(frontier)).toBe(frontier);
	});

	it('keeps endpoints and an evenly spaced subset when over the size cap', () => {
		const size = MAX_FRONTIER_SIZE * 3;
		const frontier = createFrontier(Array.from({ length: size }, (_, i) => i));

		const thinned = thinFrontier(frontier);

		expect(thinned.costs.length).toBeLessThanOrEqual(MAX_FRONTIER_SIZE + 1);
		expect(thinned.costs.length).toBeGreaterThan(MAX_FRONTIER_SIZE / 2);
		expect(thinned.costs[0]).toBe(0);
		expect(thinned.costs[thinned.costs.length - 1]).toBe(size - 1);
		const minCostGap = (size - 1) / MAX_FRONTIER_SIZE;
		for (let i = 1; i < thinned.costs.length - 1; i++) {
			expect(thinned.costs[i] - thinned.costs[i - 1]).toBeGreaterThanOrEqual(minCostGap);
		}
		// Every kept state still carries the data of the original state it came from
		thinned.previousStateIndices.forEach((originalIndex, i) => {
			expect(thinned.costs[i]).toBe(frontier.costs[originalIndex]);
			expect(thinned.values[i]).toBe(frontier.values[originalIndex]);
			expect(thinned.itemIndices[i]).toBe(frontier.itemIndices[originalIndex]);
		});
	});

	it('collapses a dense cluster of costs while keeping sparse states', () => {
		// Most states are packed near zero; a few are spread far out
		const dense = Array.from({ length: MAX_FRONTIER_SIZE * 2 }, (_, i) => i * 1e-9);
		const sparse = [1_000, 2_000, 3_000];
		const frontier = createFrontier([...dense, ...sparse]);

		const thinned = thinFrontier(frontier);

		expect(Array.from(thinned.costs)).toEqual([0, ...sparse]);
	});
});
