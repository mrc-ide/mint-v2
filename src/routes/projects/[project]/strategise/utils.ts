import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { combineCostsAndCasesAverted, DEFAULT_POPULATION, getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getAvertedCasesData,
	type CasesAverted
} from '$lib/process-results/processCases';
import type { Region, Scenario } from '$lib/types/userState';
import type { StrategiseRegions } from './schema';

export const getCasesAvertedAndCostsForStrategise = (regions: Region[]): StrategiseRegions => {
	return regions.map(processRegionData).filter((region) => region !== null);
};

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

const extractCasesAvertedData = (region: Region) => {
	const postInterventionCases = collectPostInterventionCases(region.cases);
	return getAvertedCasesData(postInterventionCases);
};

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
		casesAverted: convertPer1000ToTotal(
			casesAverted.totalAvertedCasesPer1000,
			Number(regionForm.population) || DEFAULT_POPULATION
		)
	}));
};
