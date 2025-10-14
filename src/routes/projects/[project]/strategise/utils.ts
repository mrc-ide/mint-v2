import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { combineCostsAndCasesAverted, getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getAvertedCasesData,
	type CasesAverted
} from '$lib/process-results/processCases';
import type { Region, Scenario } from '$lib/types/userState';
import type { StrategiseRegions } from './schema';

/**
 * Calculates the minimum cost across all interventions in all regions for strategy optimization.
 * Used to determine the lower bound for cost-effectiveness analysis.
 *
 * @param strategiseRegions - Array of regions with their intervention data
 * @returns The lowest intervention cost found across all regions
 */
export const getMinimumCostForStrategise = (strategiseRegions: StrategiseRegions): number => {
	const costs = strategiseRegions.flatMap((region) => region.interventions.map((intervention) => intervention.cost));
	return Math.round(Math.min(...costs));
};

/**
 * Calculates the maximum total cost by selecting the most expensive intervention from each region.
 * Used to determine the upper bound for budget allocation scenarios where the highest-cost
 * intervention is chosen per region.
 *
 * @param strategiseRegions - Array of regions with their intervention data
 * @returns The sum of the highest intervention costs from each region
 */
export const getMaximumCostForStrategise = (strategiseRegions: StrategiseRegions): number => {
	const maxCostsPerRegion = strategiseRegions.map((region) =>
		Math.max(...region.interventions.map((intervention) => intervention.cost))
	);
	return Math.round(maxCostsPerRegion.reduce((sum, cost) => sum + cost, 0));
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
const processRegionData = (region: Region) => {
	const casesAverted = extractCasesAvertedData(region);
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
 * @param region - Region containing raw cases data
 * @returns Partial record mapping scenarios to their respective cases averted data
 */
const extractCasesAvertedData = (region: Region) => {
	const postInterventionCases = collectPostInterventionCases(region.cases);
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
const buildInterventions = (
	casesAvertedData: Partial<Record<Scenario, CasesAverted>>,
	regionForm: Record<string, FormValue>
): StrategiseRegions[number]['interventions'] => {
	const scenarios = Object.keys(casesAvertedData) as Scenario[];
	const costsAndCasesAverted = combineCostsAndCasesAverted(
		getTotalCostsPerScenario(scenarios, regionForm),
		casesAvertedData
	);

	return Object.entries(costsAndCasesAverted).map(([scenario, { casesAverted, totalCost }]) => ({
		intervention: scenario,
		cost: totalCost,
		casesAverted: convertPer1000ToTotal(casesAverted.totalAvertedCasesPer1000, Number(regionForm['population']))
	}));
};
