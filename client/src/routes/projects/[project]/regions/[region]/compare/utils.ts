import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getTotalCasesPer1000
} from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';

interface CasesCompareDataPoint {
	scenario: Scenario;
	totalCases: number;
	totalCost: number;
}
export const createCasesCompareData = (
	cases: CasesData[],
	formValues: Record<string, FormValue>
): CasesCompareDataPoint[] => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	return scenarios
		.map((scenario) => {
			const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);
			return {
				scenario,
				totalCases: convertPer1000ToTotal(totalCasesPer1000, Number(formValues['population'])),
				totalCost: scenarioCosts[scenario]!
			};
		})
		.sort((a, b) => a.totalCost - b.totalCost);
};
