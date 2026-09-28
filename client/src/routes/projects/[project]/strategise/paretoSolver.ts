export interface KnapsackItem {
	cost: number;
	value: number;
}

/** Caps frontier size per region so pathological inputs stay fast; exceeding it trades exactness for speed. */
export const MAX_FRONTIER_SIZE = 100_000;

/** Relative tolerance applied to budgets to absorb floating point error in summed costs. */
const BUDGET_TOLERANCE = 1e-9;

/**
 * A Pareto frontier after some number of regions, stored as parallel typed arrays sorted by ascending cost
 * (with strictly increasing value). Each state remembers how it was reached so selections can be reconstructed.
 */
interface Frontier {
	costs: Float64Array;
	values: Float64Array;
	/** Index of the state in the previous region's frontier that this state extends. */
	previousStateIndices: Int32Array;
	/** Index of the item chosen from this region to reach this state. */
	itemIndices: Int32Array;
}

const createFrontier = (size: number): Frontier => ({
	costs: new Float64Array(size),
	values: new Float64Array(size),
	previousStateIndices: new Int32Array(size),
	itemIndices: new Int32Array(size)
});

interface BackPointers {
	previousStateIndices: Int32Array;
	itemIndices: Uint8Array;
}

/** Copies only the reconstruction data into new exact-sized buffers, so the merge buffers can be garbage collected. */
const toBackPointers = (frontier: Frontier): BackPointers => ({
	previousStateIndices: frontier.previousStateIndices.slice(),
	itemIndices: Uint8Array.from(frontier.itemIndices)
});

const sliceFrontier = (frontier: Frontier, size: number): Frontier => ({
	costs: frontier.costs.subarray(0, size),
	values: frontier.values.subarray(0, size),
	previousStateIndices: frontier.previousStateIndices.subarray(0, size),
	itemIndices: frontier.itemIndices.subarray(0, size)
});

/** Merges two frontiers into one, dropping any state beaten by a cheaper (or equal cost) state. */
const mergeFrontiers = (left: Frontier, right: Frontier): Frontier => {
	const merged = createFrontier(left.costs.length + right.costs.length);
	let leftIndex = 0;
	let rightIndex = 0;
	let mergedSize = 0;

	while (leftIndex < left.costs.length || rightIndex < right.costs.length) {
		const leftExhausted = leftIndex >= left.costs.length;
		const rightExhausted = rightIndex >= right.costs.length;
		const takeLeft =
			rightExhausted ||
			(!leftExhausted &&
				(left.costs[leftIndex] < right.costs[rightIndex] ||
					(left.costs[leftIndex] === right.costs[rightIndex] && left.values[leftIndex] >= right.values[rightIndex])));

		const source = takeLeft ? left : right;
		const sourceIndex = takeLeft ? leftIndex++ : rightIndex++;

		const isDominated = mergedSize > 0 && source.values[sourceIndex] <= merged.values[mergedSize - 1];
		if (isDominated) continue;

		merged.costs[mergedSize] = source.costs[sourceIndex];
		merged.values[mergedSize] = source.values[sourceIndex];
		merged.previousStateIndices[mergedSize] = source.previousStateIndices[sourceIndex];
		merged.itemIndices[mergedSize] = source.itemIndices[sourceIndex];
		mergedSize++;
	}

	return sliceFrontier(merged, mergedSize);
};

/** Keeps roughly MAX_FRONTIER_SIZE states evenly spread across the cost range. Dropping states keeps results feasible. */
export const thinFrontier = (frontier: Frontier): Frontier => {
	const size = frontier.costs.length;
	if (size <= MAX_FRONTIER_SIZE) return frontier;

	const minCostGap = (frontier.costs[size - 1] - frontier.costs[0]) / MAX_FRONTIER_SIZE;
	const keptIndices: number[] = [0];
	for (let stateIndex = 1; stateIndex < size - 1; stateIndex++) {
		const lastKeptCost = frontier.costs[keptIndices[keptIndices.length - 1]];
		if (frontier.costs[stateIndex] - lastKeptCost >= minCostGap) keptIndices.push(stateIndex);
	}
	keptIndices.push(size - 1);

	return {
		costs: Float64Array.from(keptIndices, (i) => frontier.costs[i]),
		values: Float64Array.from(keptIndices, (i) => frontier.values[i]),
		previousStateIndices: Int32Array.from(keptIndices, (i) => frontier.previousStateIndices[i]),
		itemIndices: Int32Array.from(keptIndices, (i) => frontier.itemIndices[i])
	};
};

/** Extends every state of the frontier with the given item, recording it as this region's choice. */
const extendFrontierWithItem = (previous: Frontier, item: KnapsackItem, itemIndex: number): Frontier => {
	const size = previous.costs.length;
	const extended = createFrontier(size);
	extended.itemIndices.fill(itemIndex);

	for (let stateIndex = 0; stateIndex < size; stateIndex++) {
		extended.costs[stateIndex] = previous.costs[stateIndex] + item.cost;
		extended.values[stateIndex] = previous.values[stateIndex] + item.value;
		extended.previousStateIndices[stateIndex] = stateIndex;
	}
	return extended;
};

/** Adds one region to the frontier by merging the frontier extended by each of its items (pairwise tournament merge). */
const addRegionToFrontier = (previous: Frontier, items: KnapsackItem[]): Frontier => {
	let candidates = items.map((item, itemIndex) => extendFrontierWithItem(previous, item, itemIndex));

	while (candidates.length > 1) {
		const nextRound: Frontier[] = [];
		for (let i = 0; i < candidates.length; i += 2) {
			const hasPair = i + 1 < candidates.length;
			nextRound.push(hasPair ? mergeFrontiers(candidates[i], candidates[i + 1]) : candidates[i]);
		}
		candidates = nextRound;
	}

	return thinFrontier(candidates[0]);
};

/** Index of the most expensive state with cost <= budget, or -1 if none fits. Relies on costs being sorted. */
const findMostExpensiveAffordableIndex = (costs: Float64Array, budget: number): number => {
	const budgetWithTolerance = budget + Math.abs(budget) * BUDGET_TOLERANCE;
	let low = 0;
	let high = costs.length - 1;
	let bestIndex = -1;

	while (low <= high) {
		const mid = (low + high) >> 1;
		if (costs[mid] <= budgetWithTolerance) {
			bestIndex = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}
	return bestIndex;
};

/** Walks back through each region's frontier to recover which item was chosen per group. */
const reconstructSelection = (backPointersByGroup: BackPointers[], finalStateIndex: number): number[] => {
	const selection = new Array<number>(backPointersByGroup.length);
	let stateIndex = finalStateIndex;
	for (let groupIndex = backPointersByGroup.length - 1; groupIndex >= 0; groupIndex--) {
		const backPointers = backPointersByGroup[groupIndex];
		selection[groupIndex] = backPointers.itemIndices[stateIndex];
		stateIndex = backPointers.previousStateIndices[stateIndex];
	}
	return selection;
};

/**
 * Solves the multiple-choice knapsack for every budget at once, maximising total value.
 *
 * @param groups - Items per group (region); exactly one item is chosen from each group
 * @param budgets - Maximum total costs to solve for
 * @returns For each budget, the chosen item index per group, or null if no selection fits the budget
 *
 * @example
 * const groups: KnapsackItem[][] = [
 * 	// Region A: no intervention, a cheap one, or an expensive one
 * 	[{ cost: 0, value: 0 }, { cost: 10, value: 50 }, { cost: 30, value: 80 }],
 * 	// Region B: no intervention, or one intervention
 * 	[{ cost: 0, value: 0 }, { cost: 20, value: 70 }]
 * ];
 *
 * solveMultipleChoiceKnapsack(groups, [-1, 0, 25, 40, 100]);
 * // => [
 * //   null,   // budget -1:  nothing fits
 * //   [0, 0], // budget 0:   A none + B none           (cost 0,  value 0)
 * //   [0, 1], // budget 25:  A none + B intervention   (cost 20, value 70)
 * //   [1, 1], // budget 40:  A cheap + B intervention  (cost 30, value 120)
 * //   [2, 1]  // budget 100: A expensive + B intervention (cost 50, value 150)
 * // ]
 */
export const solveMultipleChoiceKnapsack = (groups: KnapsackItem[][], budgets: number[]): (number[] | null)[] => {
	if (groups.some((items) => items.length === 0)) return budgets.map(() => null);

	const backPointersByGroup: BackPointers[] = [];
	let frontier: Frontier = {
		costs: new Float64Array([0]),
		values: new Float64Array([0]),
		previousStateIndices: new Int32Array([-1]),
		itemIndices: new Int32Array([-1])
	};
	for (const items of groups) {
		frontier = addRegionToFrontier(frontier, items);
		backPointersByGroup.push(toBackPointers(frontier));
	}

	return budgets.map((budget) => {
		const finalStateIndex = findMostExpensiveAffordableIndex(frontier.costs, budget);
		if (finalStateIndex === -1) return null;
		return reconstructSelection(backPointersByGroup, finalStateIndex);
	});
};
