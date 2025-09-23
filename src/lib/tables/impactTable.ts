import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent } from '$lib/components/ui/data-table';
import { getMeanCasesPostIntervention, type CasesAverted } from '$lib/process-results/processCases';
import { getMeanPrevalencePostIntervention } from '$lib/process-results/processPrevalence';
import type { CasesData, PrevalenceData, Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export interface ImpactTableMetrics {
	intervention: string;
	casesAvertedMeanPer1000: number;
	casesAvertedYear1Per1000: number;
	casesAvertedYear2Per1000: number;
	casesAvertedYear3Per1000: number;
	relativeReductionInCases: number;
	meanCasesPerYearPerPerson: number;
	relativeReductionInPrevalence: number;
}

export const buildImpactTableData = (
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	prevalenceData: PrevalenceData[],
	postInterventionCasesMap: Record<Scenario, CasesData[]>
): ImpactTableMetrics[] => {
	const meanPrevalenceNoIntervention = getMeanPrevalencePostIntervention(prevalenceData, 'no_intervention');
	const noInterventionMeanCases = getMeanCasesPostIntervention(postInterventionCasesMap['no_intervention']) ?? 0;

	return Object.entries(casesAverted).map(
		([
			scenario,
			{ casesAvertedMeanPer1000, casesAvertedYear1Per1000, casesAvertedYear2Per1000, casesAvertedYear3Per1000 }
		]) => {
			const meanPrevalence = getMeanPrevalencePostIntervention(prevalenceData, scenario as Scenario);
			const meanCasesPer1000Year = getMeanCasesPostIntervention(postInterventionCasesMap[scenario as Scenario]) ?? 0;

			return {
				intervention: ScenarioToLabel[scenario as Scenario],
				casesAvertedMeanPer1000,
				casesAvertedYear1Per1000,
				casesAvertedYear2Per1000,
				casesAvertedYear3Per1000,
				relativeReductionInCases: (casesAvertedMeanPer1000 / noInterventionMeanCases) * 100,
				meanCasesPerYearPerPerson: meanCasesPer1000Year / 1000,
				relativeReductionInPrevalence:
					((meanPrevalenceNoIntervention - meanPrevalence) / meanPrevalenceNoIntervention) * 100
			};
		}
	);
};
const ImpactTableInfo: Record<
	keyof ImpactTableMetrics,
	{ label: string; formatStyle: 'string' | 'percent' | 'decimal' }
> = {
	intervention: { label: 'Interventions', formatStyle: 'string' },
	casesAvertedMeanPer1000: {
		label: 'Mean cases averted per 1,000 people annually across 3 years since intervention',
		formatStyle: 'decimal'
	},
	casesAvertedYear1Per1000: {
		label: 'Cases averted per 1,000 people: Year 1 post intervention',
		formatStyle: 'decimal'
	},
	casesAvertedYear2Per1000: {
		label: 'Cases averted per 1,000 people: Year 2 post intervention',
		formatStyle: 'decimal'
	},
	casesAvertedYear3Per1000: {
		label: 'Cases averted per 1,000 people: Year 3 post intervention',
		formatStyle: 'decimal'
	},
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
			const value = getValue() as string | number;

			if (headerInfo.formatStyle === 'string') return value;

			const formatter = new Intl.NumberFormat('en-US', {
				style: headerInfo.formatStyle,
				maximumSignificantDigits: 3
			});
			const formattedValue = headerInfo.formatStyle === 'percent' ? (value as number) / 100 : (value as number);
			return formatter.format(formattedValue);
		},
		header: ({ column }) => {
			return renderComponent(DataTableSortHeader, {
				onclick: column.getToggleSortingHandler(),
				label: headerInfo.label
			});
		}
	})
);
