import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { renderComponent } from '$lib/components/ui/data-table';
import { getMeanCasesPostIntervention, type CasesAverted } from '$lib/process-results/processCases';
import { getMeanPrevalencePostIntervention } from '$lib/process-results/processPrevalence';
import type { CasesData, PrevalenceData, Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export interface ImpactTableMetrics {
	intervention: string;
	netUse?: number;
	irs?: number;
	lsm?: number;
	casesAvertedMean: number;
	casesAvertedYear1: number;
	casesAvertedYear2: number;
	casesAvertedYear3: number;
	relativeReductionInCases: number;
	meanCasesPerYearPerPerson: number;
	relativeReductionInPrevalence: number;
}

export const buildImpactTableData = (
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	prevalenceData: PrevalenceData[],
	postInterventionCasesMap: Record<Scenario, CasesData[]>,
	form: Record<string, FormValue>
): ImpactTableMetrics[] => {
	const meanPrevalenceNoIntervention = getMeanPrevalencePostIntervention(prevalenceData, 'no_intervention');
	const noInterventionAverageCases = getMeanCasesPostIntervention(postInterventionCasesMap['no_intervention']) ?? 0;

	return Object.entries(casesAverted).map(
		([
			scenario,
			{ average: averageCasesAverted, year1: casesAvertedYear1, year2: casesAvertedYear2, year3: casesAvertedYear3 }
		]) => {
			const meanPrevalence = getMeanPrevalencePostIntervention(prevalenceData, scenario as Scenario);
			const meanCasesPer1000Year = getMeanCasesPostIntervention(postInterventionCasesMap[scenario as Scenario]) ?? 0;

			return {
				intervention: ScenarioToLabel[scenario as Scenario],
				netUse: scenario.includes('py') ? (form.itn_future as number) : undefined,
				irs: scenario === 'irs_only' ? (form.irs_future as number) : undefined,
				lsm: scenario.includes('with_lsm') ? (form.lsm as number) : undefined,
				casesAvertedMean: averageCasesAverted,
				casesAvertedYear1: casesAvertedYear1,
				casesAvertedYear2: casesAvertedYear2,
				casesAvertedYear3: casesAvertedYear3,
				relativeReductionInCases: (averageCasesAverted / noInterventionAverageCases) * 100,
				meanCasesPerYearPerPerson: meanCasesPer1000Year / 1000,
				relativeReductionInPrevalence:
					((meanPrevalenceNoIntervention - meanPrevalence) / meanPrevalenceNoIntervention) * 100
			};
		}
	);
};
export const ImpactTableInfo = {
	intervention: { label: 'Interventions', formatStyle: 'string' },
	netUse: { label: 'Net use (%)', formatStyle: 'percent' },
	irs: { label: 'IRS cover (%)', formatStyle: 'percent' },
	lsm: { label: 'Reduction in mosquitoes from LSM (%)', formatStyle: 'percent' },
	casesAvertedMean: {
		label: 'Mean cases averted per 1,000 people annually across 3 years since intervention',
		formatStyle: 'decimal'
	},
	casesAvertedYear1: { label: 'Cases averted per 1,000 people: Year 1 post intervention', formatStyle: 'decimal' },
	casesAvertedYear2: { label: 'Cases averted per 1,000 people: Year 2 post intervention', formatStyle: 'decimal' },
	casesAvertedYear3: { label: 'Cases averted per 1,000 people: Year 3 post intervention', formatStyle: 'decimal' },
	relativeReductionInCases: {
		label: 'Relative reduction in clinical cases across 3 years since intervention',
		formatStyle: 'percent'
	},
	meanCasesPerYearPerPerson: {
		label: 'Mean cases per person per year averaged across 3 years',
		formatStyle: 'decimal'
	},
	relativeReductionInPrevalence: {
		label: 'Relative reduction in prevalence across 36 months post intervention',
		formatStyle: 'percent'
	}
} as const;

export const impactTableColumns: ColumnDef<ImpactTableMetrics>[] = Object.entries(ImpactTableInfo).map(
	([key, headerInfo]) => ({
		accessorKey: key,
		cell: ({ getValue }) => {
			const value = getValue();

			if (headerInfo.formatStyle === 'string') return value;

			const formatter = new Intl.NumberFormat('en-US', {
				style: headerInfo.formatStyle,
				maximumFractionDigits: 1
			});
			const formattedValue = headerInfo.formatStyle === 'percent' ? (value as number) / 100 : (value as number);
			return value !== undefined ? formatter.format(formattedValue) : 'N/A';
		},
		header: ({ column }) => {
			return renderComponent(DataTableSortHeader, {
				onclick: column.getToggleSortingHandler(),
				label: headerInfo.label
			});
		}
	})
);
