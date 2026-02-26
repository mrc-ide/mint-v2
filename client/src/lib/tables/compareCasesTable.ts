import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { renderComponent } from '$lib/components/ui/data-table';
import { getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getTotalCasesPer1000
} from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';
import type {
	CompareFormValues,
	CompareResults
} from '$routes/projects/[project]/regions/[region]/compare/_components/CompareResults.svelte';
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/table-core';

export interface ComparisonTimeFramesData {
	intervention: string;
	presentCost?: number;
	presentCases?: number;
	longTermBaselineCost?: number;
	longTermBaselineCases?: number;
	fullLongTermCost?: number;
	fullLongTermCases?: number;
}

const getCasesHeader = () => ({
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, string>) => {
		return renderComponent(DataTableSortHeader, {
			onclick: column.getToggleSortingHandler(),
			label: 'Cases'
		});
	}
});

export const getCasesCell = () => ({
	cell: ({ getValue }: CellContext<ComparisonTimeFramesData, number | undefined>) => {
		const cellValue = getValue();
		if (cellValue === undefined) return '-';

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'decimal',
			trailingZeroDisplay: 'stripIfInteger',
			maximumFractionDigits: 0
		});
		return formatter.format(cellValue);
	}
});

const getCostsHeader = () => ({
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, string>) => {
		return renderComponent(DataTableSortHeader, {
			onclick: column.getToggleSortingHandler(),
			label: 'Cost'
		});
	}
});
const getCostsCell = () => ({
	cell: ({ getValue }: CellContext<ComparisonTimeFramesData, number | undefined>) => {
		const value = getValue();
		if (value === undefined) return '-';

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			trailingZeroDisplay: 'stripIfInteger',
			currency: 'USD',
			maximumFractionDigits: 0
		});
		return formatter.format(value);
	}
});

export const compareCasesTableColumns: ColumnDef<ComparisonTimeFramesData>[] = [
	{
		accessorKey: 'intervention',
		header: 'Intervention',
		columns: [
			{
				accessorKey: 'intervention',
				cell: ({ getValue }) => getValue(),
				header: undefined
			}
		]
	},
	{
		accessorKey: 'present',
		header: 'Present',
		columns: [
			{
				accessorKey: 'presentCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'presentCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
	},
	{
		accessorKey: 'longTermBaseline',
		header: 'Long term (baseline only)',
		columns: [
			{
				accessorKey: 'longTermBaselineCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'longTermBaselineCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
	},
	{
		accessorKey: 'fullLongTerm',
		header: 'Long term (baseline + control strategy)',
		columns: [
			{
				accessorKey: 'fullLongTermCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'fullLongTermCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
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
	const population = Number(formValues['population']);
	for (const scenario of scenarios) {
		const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);

		totalsByScenario[scenario as Scenario] = {
			totalCost: scenarioCosts[scenario] ?? 0,
			totalCases: convertPer1000ToTotal(totalCasesPer1000, population)
		};
	}

	return totalsByScenario;
};

const getScenarioKeys = (...summaryByTimeFrames: Partial<Record<Scenario, ScenarioTotals>>[]): Scenario[] => [
	...new Set(summaryByTimeFrames.flatMap((summary) => Object.keys(summary) as Scenario[]))
];

export const buildCompareCasesTableData = (
	{ present, baselineLongTerm, fullLongTerm }: CompareResults,
	{ presentFormValues, longTermFormValues }: CompareFormValues
): ComparisonTimeFramesData[] => {
	const presentData = createCasesSummary(present.cases, presentFormValues);
	const baselineLongTermData = createCasesSummary(baselineLongTerm.cases, presentFormValues);
	const fullLongTermData = createCasesSummary(fullLongTerm.cases, longTermFormValues);

	const scenarios = getScenarioKeys(presentData, baselineLongTermData, fullLongTermData);

	return scenarios.map((scenario) => ({
		intervention: ScenarioToLabel[scenario as Scenario],
		presentCost: presentData[scenario as Scenario]?.totalCost,
		presentCases: presentData[scenario as Scenario]?.totalCases,
		longTermBaselineCost: baselineLongTermData[scenario as Scenario]?.totalCost,
		longTermBaselineCases: baselineLongTermData[scenario as Scenario]?.totalCases,
		fullLongTermCost: fullLongTermData[scenario as Scenario]?.totalCost,
		fullLongTermCases: fullLongTermData[scenario as Scenario]?.totalCases
	}));
};
