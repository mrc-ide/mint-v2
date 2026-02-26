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

interface ScenarioTotals {
	totalCost: number;
	totalCases: number;
}

const createCasesSummary = (
	cases: CasesData[],
	formValues: Record<string, FormValue>
): Partial<Record<Scenario, ScenarioTotals>> => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	const totalsByScenario = {} as Partial<Record<Scenario, ScenarioTotals>>;
	for (const scenario of scenarios) {
		const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);

		totalsByScenario[scenario as Scenario] = {
			totalCost: scenarioCosts[scenario] ?? 0,
			totalCases: convertPer1000ToTotal(totalCasesPer1000, Number(formValues['population']))
		};
	}

	return totalsByScenario;
};

const getScenarioKeys = (...summaryByTimeFrames: Partial<Record<Scenario, ScenarioTotals>>[]): Scenario[] => [
	...new Set(summaryByTimeFrames.flatMap((summary) => Object.keys(summary) as Scenario[]))
];

const formatScenarioTotals = (totals?: ScenarioTotals): string =>
	totals
		? `${convertToLocaleString(totals.totalCases, 1)} cases, $${convertToLocaleString(totals.totalCost, 1)}`
		: 'N/A';

export const buildCompareCasesTableData = (
	presentCases: CasesData[],
	fullLongTermCases: CasesData[],
	baselineLongTermCases: CasesData[],
	presentFormValues: Record<string, FormValue>,
	longTermFormValues: Record<string, FormValue>
): ComparisonTimeFramesData[] => {
	const presentData = createCasesSummary(presentCases, presentFormValues);
	const baselineLongTermData = createCasesSummary(baselineLongTermCases, presentFormValues);
	const fullLongTermData = createCasesSummary(fullLongTermCases, longTermFormValues);

	const scenarios = getScenarioKeys(presentData, baselineLongTermData, fullLongTermData);

	return scenarios.map((scenario) => ({
		intervention: ScenarioToLabel[scenario as Scenario],
		present: formatScenarioTotals(presentData[scenario as Scenario]),
		longTermBaseline: formatScenarioTotals(baselineLongTermData[scenario as Scenario]),
		fullLongTerm: formatScenarioTotals(fullLongTermData[scenario as Scenario])
	}));
};
