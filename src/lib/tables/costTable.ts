import { renderComponent } from '$lib/components/ui/data-table';
import type { ColumnDef } from '@tanstack/table-core';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import type { Scenario } from '$lib/types/userState';
import { convertPer1000ToTotal, type CasesAverted } from '$lib/process-results/processCases';
import { ScenarioToLabel } from '$lib/charts/baseChart';

export interface CostTableMetrics {
	intervention: string;
	casesAvertedTotal: number;
	totalCost: number;
	costPerCaseAverted: number;
}
export const buildCostTableData = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): CostTableMetrics[] => {
	const scenarios = Object.keys(casesAverted) as Scenario[];

	return scenarios
		.filter((scenario) => casesAverted[scenario] && totalCosts[scenario]) // safety check
		.map((scenario) => {
			const casesAvertedTotal = convertPer1000ToTotal(casesAverted[scenario]!.totalAvertedCasesPer1000, population);
			return {
				intervention: ScenarioToLabel[scenario],
				casesAvertedTotal,
				totalCost: totalCosts[scenario]!,
				costPerCaseAverted: totalCosts[scenario]! / casesAvertedTotal
			};
		});
};

const CostTableInfo: Record<keyof CostTableMetrics, { label: string; formatStyle: 'string' | 'decimal' | 'currency' }> =
	{
		intervention: { label: 'Interventions', formatStyle: 'string' },
		casesAvertedTotal: { label: 'Total cases averted', formatStyle: 'decimal' },
		totalCost: { label: 'Total costs (USD)', formatStyle: 'currency' },
		costPerCaseAverted: { label: 'Cost per case averted across 3 years (USD)', formatStyle: 'currency' }
	};
export const costTableColumns: ColumnDef<CostTableMetrics>[] = Object.entries(CostTableInfo).map(
	([key, headerInfo]) => ({
		accessorKey: key,
		cell: ({ getValue }) => {
			const value = getValue() as string | number;

			if (headerInfo.formatStyle === 'string') return value;

			const formatter = new Intl.NumberFormat('en-US', {
				style: headerInfo.formatStyle,
				maximumFractionDigits: 1,
				currency: 'USD',
				notation: 'compact'
			});
			return formatter.format(value as number);
		},
		header: ({ column }) => {
			return renderComponent(DataTableSortHeader, {
				onclick: column.getToggleSortingHandler(),
				label: headerInfo.label
			});
		}
	})
);
