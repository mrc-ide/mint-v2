import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent } from '$lib/components/ui/data-table';
import type { CostCasesAndAverted } from '$lib/process-results/costs';
import { convertPer1000ToTotal } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export interface CostTableMetrics {
	intervention: string;
	casesAvertedTotal: number;
	totalCost: number;
	costPerCaseAverted: number;
}
export const buildCostTableData = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
	population: number
): CostTableMetrics[] =>
	Object.entries(costsAndCasesAverted).map(([scenario, { casesAverted, totalCost }]) => {
		const casesAvertedTotal = convertPer1000ToTotal(casesAverted.totalAvertedCasesPer1000, population);
		return {
			intervention: ScenarioToLabel[scenario as Scenario],
			casesAvertedTotal,
			totalCost: totalCost,
			costPerCaseAverted: totalCost / casesAvertedTotal
		};
	});

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
				trailingZeroDisplay: 'stripIfInteger',
				currency: 'USD',
				maximumFractionDigits: 2
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
