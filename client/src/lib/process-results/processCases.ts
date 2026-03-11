import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { roundNumber } from '$lib/number';
import { PRE_INTERVENTION_YEAR, SCENARIOS, type CasesData, type Scenario } from '$lib/types/userState';
import { getTotalCostsPerScenario } from './costs';

export interface CasesAverted {
	casesAvertedYear1Per1000: number;
	casesAvertedYear2Per1000: number;
	casesAvertedYear3Per1000: number;
	casesAvertedMeanPer1000: number;
	totalAvertedCasesPer1000: number;
}
const POST_INTERVENTION_YEARS = [2, 3, 4] as const;

export const getTotalCasesPer1000 = (cases: CasesData[]) => cases.reduce((sum, c) => sum + c.casesPer1000, 0);

export const getMeanCasesPer1000 = (cases: CasesData[]) =>
	cases.reduce((sum, c) => sum + c.casesPer1000, 0) / cases.length;

// Group cases by scenario (ensuring order), filtering out year 1 (pre-intervention year)
export const collectPostInterventionCases = (cases: CasesData[]): Record<Scenario, CasesData[]> => {
	const postInterventionCases = cases.filter((c) => c.year > PRE_INTERVENTION_YEAR);

	return SCENARIOS.reduce(
		(acc, scenario) => {
			acc[scenario] = postInterventionCases.filter((c) => c.scenario === scenario);
			return acc;
		},
		{} as Record<Scenario, CasesData[]>
	);
};

export const getAvertedCasesData = (
	postInterventionCasesMap: Record<Scenario, CasesData[]>
): Partial<Record<Scenario, CasesAverted>> => {
	const noInterventionCases = postInterventionCasesMap['no_intervention'];
	if (!noInterventionCases?.length) return {};

	// Pre-calculate no intervention data
	const noInterventionByYear = new Map(noInterventionCases.map((c) => [c.year, c.casesPer1000]));
	const meanNoInterventionCases = getMeanCasesPer1000(noInterventionCases);

	// Calculate cases averted for each intervention scenario
	const casesAverted: Partial<Record<Scenario, CasesAverted>> = {};

	for (const [scenario, scenarioCases] of Object.entries(postInterventionCasesMap)) {
		if (scenario === 'no_intervention' || !scenarioCases.length) continue;

		const casesByYear = new Map(scenarioCases.map((c) => [c.year, c.casesPer1000]));
		const meanCasesForScenario = getMeanCasesPer1000(scenarioCases);

		const [casesAvertedYear1Per1000, casesAvertedYear2Per1000, casesAvertedYear3Per1000] = POST_INTERVENTION_YEARS.map(
			(year) => (noInterventionByYear.get(year) ?? 0) - (casesByYear.get(year) ?? 0)
		);
		const casesAvertedMeanPer1000 = meanNoInterventionCases - meanCasesForScenario;

		if (roundNumber(casesAvertedMeanPer1000, 1) > 0) {
			casesAverted[scenario as Scenario] = {
				casesAvertedYear1Per1000,
				casesAvertedYear2Per1000,
				casesAvertedYear3Per1000,
				casesAvertedMeanPer1000,
				totalAvertedCasesPer1000: casesAvertedYear1Per1000 + casesAvertedYear2Per1000 + casesAvertedYear3Per1000
			};
		} else {
			// Skip scenarios where mean cases averted rounds to 0 or less at 1 decimal place (likely model error)
			casesAverted[scenario as Scenario] = {
				casesAvertedYear1Per1000: 0,
				casesAvertedYear2Per1000: 0,
				casesAvertedYear3Per1000: 0,
				casesAvertedMeanPer1000: 0,
				totalAvertedCasesPer1000: 0
			};
		}
	}

	return casesAverted;
};

export interface ScenarioTotals {
	totalCost: number;
	totalCases: number;
}

export const getTotalCasesAndCostsPerScenario = (
	cases: CasesData[],
	formValues: Record<string, FormValue>
): Partial<Record<Scenario, ScenarioTotals>> => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	const totalsByScenario = {} as Partial<Record<Scenario, ScenarioTotals>>;
	const population = Number(formValues['population']);
	for (const scenario of scenarios) {
		const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);

		totalsByScenario[scenario as Scenario] = {
			totalCost: scenarioCosts[scenario]!,
			totalCases: convertPer1000ToTotal(totalCasesPer1000, population)
		};
	}

	return totalsByScenario;
};

export const convertPer1000ToTotal = (per1000: number, population: number) => (per1000 / 1000) * population;
export const convertTotalToPer1000 = (total: number, population: number) => (total / population) * 1000;
