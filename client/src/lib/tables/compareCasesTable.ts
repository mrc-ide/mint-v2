import { ScenarioToLabel } from '$lib/charts/baseChart';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { convertToLocaleString } from '$lib/number';
import { getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getTotalCasesPer1000
} from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export interface ComparisonTimeFramesData {
	intervention: string;
	present: string;
	longTermBaseline: string;
	fullLongTerm: string;
}

export const compareCasesTableColumns: ColumnDef<ComparisonTimeFramesData>[] = [
	{
		accessorKey: 'intervention',
		header: 'Intervention'
	},
	{
		accessorKey: 'present',
		header: 'Present'
	},
	{
		accessorKey: 'longTermBaseline',
		header: 'Long term (baseline only)'
	},
	{
		accessorKey: 'fullLongTerm',
		header: 'Long term (baseline + control strategy)'
	}
];

const createComparisonTimeFramesData = (cases: CasesData[], formValues: Record<string, FormValue>) => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	const casesByTotalCost = scenarios.map((scenario) => {
		const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);
		return {
			scenario,
			totalCases: convertPer1000ToTotal(totalCasesPer1000, Number(formValues['population'])),
			totalCost: scenarioCosts[scenario]!
		};
	});

	return casesByTotalCost;
};
export const buildCompareCasesTableData = (
	presentCases: CasesData[],
	fullLongTermCases: CasesData[],
	baselineLongTermCases: CasesData[],
	presentFormValues: Record<string, FormValue>,
	longTermFormValues: Record<string, FormValue>
): ComparisonTimeFramesData[] => {
	const presentData = createComparisonTimeFramesData(presentCases, presentFormValues);
	const baselineLongTermData = createComparisonTimeFramesData(baselineLongTermCases, presentFormValues);
	const fullLongTermData = createComparisonTimeFramesData(fullLongTermCases, longTermFormValues);

	const scenarios = [...new Set([...presentData, ...baselineLongTermData, ...fullLongTermData].map((d) => d.scenario))];
	const tableData: ComparisonTimeFramesData[] = [];

	for (const scenario of scenarios) {
		const presentScenario = presentData.find((d) => d.scenario === scenario);
		const fullLongTermScenario = fullLongTermData.find((d) => d.scenario === scenario);
		const baselineLongTermScenario = baselineLongTermData.find((d) => d.scenario === scenario);

		tableData.push({
			intervention: ScenarioToLabel[scenario],
			present: presentScenario
				? `${convertToLocaleString(presentScenario.totalCases, 1)} cases - $${convertToLocaleString(presentScenario.totalCost, 0)}`
				: 'N/A',
			longTermBaseline: baselineLongTermScenario
				? `${convertToLocaleString(baselineLongTermScenario.totalCases, 1)} cases - $${convertToLocaleString(baselineLongTermScenario.totalCost, 0)}`
				: 'N/A',
			fullLongTerm: fullLongTermScenario
				? `${convertToLocaleString(fullLongTermScenario.totalCases, 1)} cases - $${convertToLocaleString(fullLongTermScenario.totalCost, 0)}`
				: 'N/A'
		});
	}

	return tableData;
};
