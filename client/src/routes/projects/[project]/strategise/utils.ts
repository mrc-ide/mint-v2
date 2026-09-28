import { ScenarioToColor } from '$lib/charts/baseChart';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { createLinearSpace } from '$lib/number';
import { combineCostsAndCasesAverted, getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getAvertedCasesData,
	getTotalCasesAndCostsPerScenario,
	type CasesAverted
} from '$lib/process-results/processCases';
import type {
	CasesData,
	CompareStrategiseResults,
	Region,
	Scenario,
	StrategiseResult,
	StrategiseResults
} from '$lib/types/userState';
import type {
	Block,
	CompareStrategiseRegions,
	MetricKey,
	RegionRow,
	StrategiseRegionByMetric,
	StrategiseResultIntervention
} from './schema';
import { solveMultipleChoiceKnapsack } from './paretoSolver';

const mapTotalsToInterventions = (
	totals: ReturnType<typeof getTotalCasesAndCostsPerScenario>
): StrategiseRegionByMetric<'cases'>['interventions'] =>
	Object.entries(totals).map(([scenario, { totalCost, totalCases }]) => ({
		intervention: scenario as Scenario,
		cost: totalCost,
		cases: totalCases
	}));

const buildCompareRegion = (
	region: Region,
	cases: CasesData[],
	formValues: Record<string, FormValue> = {}
): StrategiseRegionByMetric<'cases'> => ({
	region: region.name,
	interventions: mapTotalsToInterventions(getTotalCasesAndCostsPerScenario(cases, formValues))
});

/**
 * Processes a list of regions to extract and structure data for strategise comparison.
 * @param regions  - Array of regions to process for strategise comparison
 * @returns Structured data for strategise comparison, or null if insufficient valid data is available
 */
export const getCasesAndCostsForCompareStrategise = (regions: Region[]): CompareStrategiseRegions | null => {
	const filteredRegions = regions.filter((region) => region.results?.cases && region.fullLongTermCases);

	if (filteredRegions.length < 2) return null; // Need at least 2 regions with valid data to perform comparison

	return {
		present: filteredRegions.map((region) =>
			buildCompareRegion(region, region.results!.cases, region.formValues ?? {})
		),
		longTerm: filteredRegions.map((region) =>
			buildCompareRegion(region, region.fullLongTermCases!, region.longTermFormValues ?? {})
		)
	};
};

/**
 * Calculates the minimum cost across all interventions in all regions for strategy optimization.
 * Used to determine the lower bound for cost-effectiveness analysis.
 *
 * @param strategiseRegions - Array of regions with their intervention data
 * @returns The lowest intervention cost found across all regions
 */
export const getMinimumCostForStrategise = (
	strategiseRegions: StrategiseRegionByMetric<'casesAverted'>[] | StrategiseRegionByMetric<'cases'>[]
): number => {
	const costs = strategiseRegions.flatMap((region) => region.interventions.map((intervention) => intervention.cost));
	return Math.min(...costs);
};

/**
 * Calculates the maximum total cost by selecting the most expensive intervention from each region.
 * Used to determine the upper bound for budget allocation scenarios where the highest-cost
 * intervention is chosen per region.
 *
 * @param strategiseRegions - Array of regions with their intervention data
 * @returns The sum of the highest intervention costs from each region
 */
export const getMaximumCostForStrategise = (
	strategiseRegions: StrategiseRegionByMetric<'casesAverted'>[] | StrategiseRegionByMetric<'cases'>[]
): number => {
	const maxCostsPerRegion = strategiseRegions.map((region) =>
		Math.max(...region.interventions.map((intervention) => intervention.cost))
	);
	return maxCostsPerRegion.reduce((sum, cost) => sum + cost, 0);
};

/**
 * Processes a collection of regions to extract cases averted and cost data for strategy analysis.
 * Filters out regions that don't have valid cases averted data.
 *
 * @param regions - Array of regions
 * @returns Array of processed region data with intervention analysis, excluding regions with no valid data
 */
export const getCasesAvertedAndCostsForStrategise = (regions: Region[]): StrategiseRegionByMetric<'casesAverted'>[] => {
	return regions.map(processRegionData).filter((region) => region !== null);
};

/**
 * Processes a single region to extract and structure intervention analysis data.
 * Combines cases averted data with cost information and population from form data.
 *
 * @param region - Individual region containing cases data and form values
 * @returns Structured region data with interventions analysis, or null if no valid cases averted data exists
 */
export const processRegionData = (region: Region) => {
	const casesAverted = extractCasesAvertedData(region.results?.cases);
	if (!casesAverted || Object.keys(casesAverted).length === 0) {
		return null;
	}

	const interventions = buildInterventions(casesAverted, region.formValues ?? {});

	return {
		region: region.name,
		interventions
	};
};

/**
 * Extracts cases averted data from a region's  cases.
 * Processes post-intervention cases to calculate how many cases were prevented by interventions.
 *
 * @param cases - Array of cases data
 * @returns Partial record mapping scenarios to their respective cases averted data
 */
export const extractCasesAvertedData = (cases: CasesData[] = []) => {
	const postInterventionCases = collectPostInterventionCases(cases);
	return getAvertedCasesData(postInterventionCases);
};

/**
 * Builds intervention analysis data by combining cases averted with cost calculations.
 * Converts per-1000 population metrics to total numbers based on region population.
 *
 * @param casesAvertedData - Mapping of scenarios to their cases averted statistics
 * @param regionForm - Form values containing cost parameters and population data
 * @returns Array of intervention objects with scenario name, total cost, and total cases averted
 */
export const buildInterventions = (
	casesAvertedData: Partial<Record<Scenario, CasesAverted>>,
	regionForm: Record<string, FormValue>
): StrategiseRegionByMetric<'casesAverted'>['interventions'] => {
	const scenarios = Object.keys(casesAvertedData) as Scenario[];
	const costsAndCasesAverted = combineCostsAndCasesAverted(
		getTotalCostsPerScenario(scenarios, regionForm),
		casesAvertedData
	);

	return Object.entries(costsAndCasesAverted).map(([scenario, { casesAverted, totalCost }]) => ({
		intervention: scenario as Scenario,
		cost: totalCost,
		casesAverted: convertPer1000ToTotal(casesAverted.totalAvertedCasesPer1000, Number(regionForm['population']))
	}));
};

/**** Optimisation Helpers ****/
type OptimisationDirection = 'maximize' | 'minimize';

/**
 * Selects one intervention per region for every cost threshold, optimising the given metric.
 * Returns an empty selection for thresholds where no combination of interventions fits the budget.
 */
export const optimiseAcrossCosts = <K extends MetricKey>(
	costThresholds: number[],
	regions: StrategiseRegionByMetric<K>[],
	metric: K,
	direction: OptimisationDirection
): StrategiseResultIntervention<K>[][] => {
	const sign = direction === 'maximize' ? 1 : -1;
	const groups = regions.map(({ interventions }) =>
		interventions.map((intervention) => ({ cost: intervention.cost, value: sign * intervention[metric] }))
	);

	return solveMultipleChoiceKnapsack(groups, costThresholds).map((choices) => {
		if (!choices) return [];
		return choices.map(
			(choice, index) =>
				({
					region: regions[index].region,
					...regions[index].interventions[choice]
				}) as StrategiseResultIntervention<K>
		);
	});
};

export const strategiseAsync = (
	minCost: number,
	maxCost: number,
	regionalStrategies: StrategiseRegionByMetric<'casesAverted'>[]
): Promise<StrategiseResults> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(strategise(minCost, maxCost, regionalStrategies));
		}, 0);
	});
};

export const strategiseCompareAsync = (
	presentMinCost: number,
	compareRegionalStrategies: CompareStrategiseRegions
): Promise<CompareStrategiseResults> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(strategiseCompare(presentMinCost, compareRegionalStrategies));
		}, 0);
	});
};

/**
 * Performs strategise comparison analysis over a range of costs to generate optimal intervention strategies for both present and long-term scenarios.
 * For each cost threshold, it optimizes intervention selection to minimize cases in the present and long-term models.
 *
 * @param presentMinCost - The minimum cost threshold for the present scenario analysis
 * @param compareRegionalStrategies - Array of regions with their intervention data for both present and long-term scenarios
 * @returns Object containing arrays of strategise results for present and long-term scenarios, each with cost thresholds and selected interventions
 */
export const strategiseCompare = (
	presentMinCost: number,
	compareRegionalStrategies: CompareStrategiseRegions
): CompareStrategiseResults => {
	const presentCostRange = createLinearSpace(
		presentMinCost,
		getMaximumCostForStrategise(compareRegionalStrategies.present)
	);
	const longTermWithoutNoIntervention: StrategiseRegionByMetric<'cases'>[] = compareRegionalStrategies.longTerm.map(
		(region) => ({
			...region,
			interventions: region.interventions.filter((intervention) => intervention.intervention !== 'no_intervention')
		})
	);
	const longTermMinCost = getMinimumCostForStrategise(longTermWithoutNoIntervention);
	const longTermMaxCost = getMaximumCostForStrategise(compareRegionalStrategies.longTerm);
	const longTermCostRange =
		Number.isFinite(longTermMinCost) && Number.isFinite(longTermMaxCost)
			? createLinearSpace(longTermMinCost, longTermMaxCost)
			: [];
	const presentInterventions = optimiseAcrossCosts(
		presentCostRange,
		compareRegionalStrategies.present,
		'cases',
		'minimize'
	);
	const longTermInterventions = optimiseAcrossCosts(
		longTermCostRange,
		compareRegionalStrategies.longTerm,
		'cases',
		'minimize'
	);

	return {
		present: presentCostRange.map((costThreshold, index) => ({
			costThreshold,
			interventions: presentInterventions[index]
		})),
		longTerm: longTermCostRange.map((costThreshold, index) => ({
			costThreshold,
			interventions: longTermInterventions[index]
		}))
	};
};

/**
 * Performs strategise analysis over a range of costs to generate intervention strategies.
 * For each cost threshold, it optimizes intervention selection to maximize cases averted.
 *
 * @param minCost - The minimum cost threshold for the analysis
 * @param maxCost - The maximum cost threshold for the analysis
 * @param regionalStrategies - Array of regions with their intervention data
 * @returns Array of strategise results, each containing a cost threshold and selected interventions
 */
export const strategise = (
	minCost: number,
	maxCost: number,
	regionalStrategies: StrategiseRegionByMetric<'casesAverted'>[]
): StrategiseResults => {
	const costRange = createLinearSpace(minCost, maxCost);

	const NO_INTERVENTION = { intervention: 'no_intervention', casesAverted: 0, cost: 0 } as const;
	const strategiesIncludingNoIntervention: StrategiseRegionByMetric<'casesAverted'>[] = regionalStrategies.map(
		(region) => ({
			...region,
			interventions: [...region.interventions, NO_INTERVENTION]
		})
	);

	const interventionsPerCost = optimiseAcrossCosts(
		costRange,
		strategiesIncludingNoIntervention,
		'casesAverted',
		'maximize'
	);

	return costRange.map((costThreshold, index) => ({
		costThreshold,
		interventions: interventionsPerCost[index]
	}));
};

/**
 * Constructs detailed regional metrics used for display for a given strategy.
 */
export const constructRegionalMetrics = (strategy: StrategiseResult, populations: Record<string, number>) =>
	Object.fromEntries(
		strategy.interventions.map((intervention) => {
			const population = populations[intervention.region];
			return [
				intervention.region,
				{
					...intervention,
					population,
					costPerPerson: population > 0 ? intervention.cost / population : 0,
					costPerCaseAverted: intervention.casesAverted > 0 ? intervention.cost / intervention.casesAverted : 0,
					casesAvertedPerPerson: population > 0 ? intervention.casesAverted / population : 0
				}
			];
		})
	);

/*** Intervention grid utilities ***/
const LSM_STRIPE =
	'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--background) 7px, var(--background) 8px)';
export const getFillStyle = (scenario: Scenario): string => {
	const color = ScenarioToColor[scenario];
	let style = `background-color: ${color};`;
	if (scenario.includes('lsm')) {
		style += ` background-image: ${LSM_STRIPE};`;
	}
	return style;
};

type RegionState = {
	currentIntervention: Scenario | null;
	blockStart: number;
	blocks: Block[];
};

const pushClosedBlock = (state: RegionState, endCost: number) => {
	if (state.currentIntervention === null) return;

	state.blocks.push({
		intervention: state.currentIntervention,
		startCost: state.blockStart,
		endCost
	});
};

const updateRegionState = (state: RegionState, intervention: Scenario, threshold: number) => {
	if (intervention === state.currentIntervention) return;

	pushClosedBlock(state, threshold);
	state.currentIntervention = intervention;
	state.blockStart = threshold;
};

const buildRegionStates = (
	strategiseResults: StrategiseResults,
	allowedRegions: Set<string>
): Map<string, RegionState> => {
	const states = new Map<string, RegionState>();

	for (const result of strategiseResults) {
		const threshold = result.costThreshold;

		for (const { region, intervention } of result.interventions) {
			if (!allowedRegions.has(region)) continue;

			let state = states.get(region);
			if (!state) {
				state = { currentIntervention: null, blockStart: 0, blocks: [] };
				states.set(region, state);
			}

			updateRegionState(state, intervention, threshold);
		}
	}

	return states;
};

const finalizeRegionRows = (regions: string[], states: Map<string, RegionState>, maxCost: number): RegionRow[] => {
	return regions.map((region) => {
		const state = states.get(region);
		if (!state) return { region, blocks: [] };

		pushClosedBlock(state, maxCost);
		return { region, blocks: state.blocks };
	});
};

export const createGridRows = (strategiseResults: StrategiseResults, maxCost: number): RegionRow[] => {
	if (strategiseResults.length === 0) return [];

	const regions = strategiseResults[0].interventions.map((i) => i.region);

	const states = buildRegionStates(strategiseResults, new Set(regions));
	return finalizeRegionRows(regions, states, maxCost);
};

export const getGridTicks = (minCost: number, costRange: number) => {
	const TICK_COUNT = 8;
	const result: number[] = [];
	for (let i = 0; i <= TICK_COUNT; i++) {
		result.push(minCost + (costRange * i) / TICK_COUNT);
	}
	return result;
};

export const getGridLegendItems = (rows: RegionRow[]) => {
	const uniqueScenarios = new Set<Scenario>();
	for (const row of rows) {
		for (const block of row.blocks) {
			uniqueScenarios.add(block.intervention);
		}
	}
	return uniqueScenarios;
};
