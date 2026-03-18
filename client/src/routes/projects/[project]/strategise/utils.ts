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
	CompareStrategiseIntervention,
	CompareStrategiseResults,
	Region,
	Scenario,
	StrategiseIntervention,
	StrategiseResult,
	StrategiseResults
} from '$lib/types/userState';
import { equalTo, lessEq, solve, type Constraint, type Model } from 'yalps';
import type { CompareStrategiseRegion, CompareStrategiseRegions, StrategiseRegions } from './schema';

const mapTotalsToInterventions = (
	totals: ReturnType<typeof getTotalCasesAndCostsPerScenario>
): CompareStrategiseRegion['interventions'] =>
	Object.entries(totals).map(([scenario, { totalCost, totalCases }]) => ({
		intervention: scenario as Scenario,
		cost: totalCost,
		cases: totalCases
	}));

const buildCompareRegion = (
	region: Region,
	cases: CasesData[],
	formValues: Record<string, FormValue> = {}
): CompareStrategiseRegion => ({
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
	strategiseRegions: StrategiseRegions | CompareStrategiseRegion[]
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
	strategiseRegions: StrategiseRegions | CompareStrategiseRegion[]
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
export const getCasesAvertedAndCostsForStrategise = (regions: Region[]): StrategiseRegions => {
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
): StrategiseRegions[number]['interventions'] => {
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
type OptimizationVariables = Record<
	string,
	{
		cost: number;
		casesAverted: number;
		[regionName: string]: number;
	}
>;

type CompareOptimizationVariables = Record<
	string,
	{
		cost: number;
		cases: number;
		[region: string]: number;
	}
>;

type OptimisationDirection = 'maximize' | 'minimize';

const runOptimisation = <TResult, TVariables extends Record<string, Record<string, number>>>(
	cost: number,
	direction: OptimisationDirection,
	objective: string,
	constraints: Record<string, Constraint>,
	variables: TVariables,
	mapResult: (variableName: string) => TResult
): TResult[] => {
	const model: Model = {
		direction,
		objective,
		constraints: { ...constraints, cost: lessEq(cost) },
		variables,
		binaries: true
	};

	const solution = solve(model);
	if (solution.status !== 'optimal') {
		console.warn(`No optimal solution found for cost: ${cost}`);
		return [];
	}

	return solution.variables
		.filter(([_, isSelected]) => isSelected === 1)
		.map(([variableName]) => mapResult(variableName));
};

export const strategiseAsync = (
	minCost: number,
	maxCost: number,
	regionalStrategies: StrategiseRegions
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
	const longTermWithoutNoIntervention: CompareStrategiseRegion[] = compareRegionalStrategies.longTerm.map((region) => ({
		...region,
		interventions: region.interventions.filter((intervention) => intervention.intervention !== 'no_intervention')
	}));

	const longTermCostRange = createLinearSpace(
		getMinimumCostForStrategise(longTermWithoutNoIntervention),
		getMaximumCostForStrategise(compareRegionalStrategies.longTerm)
	);

	const presentModel = setupOptimisationModelForCompare(compareRegionalStrategies.present);
	const longTermModel = setupOptimisationModelForCompare(compareRegionalStrategies.longTerm);

	return {
		present: presentCostRange.map((costThreshold) => ({
			costThreshold,
			interventions: optimiseForMinCases(costThreshold, presentModel)
		})),
		longTerm: longTermCostRange.map((costThreshold) => ({
			costThreshold,
			interventions: optimiseForMinCases(costThreshold, longTermModel)
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
	regionalStrategies: StrategiseRegions
): StrategiseResults => {
	const costRange = createLinearSpace(minCost, maxCost);

	const NO_INTERVENTION = { intervention: 'no_intervention', casesAverted: 0, cost: 0 } as const;
	const strategiesIncludingNoIntervention: StrategiseRegions = regionalStrategies.map((region) => ({
		...region,
		interventions: [...region.interventions, NO_INTERVENTION]
	}));

	const { constraints, variables } = setupOptimisationModel(strategiesIncludingNoIntervention);

	return costRange.map((costThreshold) => ({
		costThreshold,
		interventions: runOptimisation(costThreshold, 'maximize', 'casesAverted', constraints, variables, (variableName) =>
			parseOptimisationResult(variableName, variables)
		)
	}));
};

/**
 * Optimizes intervention selection to minimize cases for a given cost threshold using linear programming.
 */
export const optimiseForMinCases = (
	cost: number,
	{ constraints, variables }: ReturnType<typeof setupOptimisationModelForCompare>
): CompareStrategiseIntervention[] => {
	return runOptimisation(cost, 'minimize', 'cases', constraints, variables, (variableName) =>
		parseCompareOptimisationResult(variableName, variables)
	);
};

/** Sets up optimization constraints and variables for linear programming.  */
const setupOptimisationModelForCompare = (regions: CompareStrategiseRegion[]) => {
	const constraints: Record<string, Constraint> = {};
	const variables: CompareOptimizationVariables = {};

	for (const { region, interventions } of regions) {
		constraints[region] = equalTo(1);

		for (const { intervention, cost, cases } of interventions) {
			const variableName = `${region}--${intervention}`;
			variables[variableName] = {
				cost,
				cases,
				[region]: 1
			};
		}
	}

	return {
		constraints,
		variables
	};
};
const setupOptimisationModel = (regions: StrategiseRegions) => {
	const constraints: Record<string, Constraint> = {};
	const variables: OptimizationVariables = {};

	for (const { region, interventions } of regions) {
		// Ensure exactly one intervention per region
		constraints[region] = equalTo(1);

		for (const { intervention, cost, casesAverted } of interventions) {
			const variableName = `${region}--${intervention}`;
			variables[variableName] = {
				cost,
				casesAverted,
				[region]: 1 // Links variable to its region constraint
			};
		}
	}

	return { constraints, variables };
};

/*** Parses optimization result variable name back to intervention data. */

export const parseOptimisationResult = (
	variableName: string,
	variables: OptimizationVariables
): StrategiseIntervention => {
	const [region, intervention] = variableName.split('--');
	const { cost, casesAverted } = variables[variableName];

	return {
		region,
		intervention: intervention as Scenario,
		cost,
		casesAverted
	};
};
export const parseCompareOptimisationResult = (
	variableName: string,
	variables: CompareOptimizationVariables
): CompareStrategiseIntervention => {
	const [region, intervention] = variableName.split('--');
	const { cost, cases } = variables[variableName];

	return {
		region,
		intervention: intervention as Scenario,
		cost,
		cases
	};
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
