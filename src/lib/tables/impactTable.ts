import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent } from '$lib/components/ui/data-table';
import { getMeanCasesPostIntervention, type CasesAverted } from '$lib/process-results/processCases';
import { getMeanPrevalencePostIntervention } from '$lib/process-results/processPrevalence';
import type { CasesData, PrevalenceData, Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export interface ImpactTableMetrics {
	intervention: string;
	casesAvertedMeanPer1000?: number;
	casesAvertedYear1Per1000?: number;
	casesAvertedYear2Per1000?: number;
	casesAvertedYear3Per1000?: number;
	relativeReductionInCases?: number;
	meanCasesPerYearPerPerson: number;
	relativeReductionInPrevalence?: number;
}

export const buildImpactTableData = (
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	prevalenceData: PrevalenceData[],
	postInterventionCasesMap: Record<Scenario, CasesData[]>
): ImpactTableMetrics[] => {
	const meanPrevalenceNoIntervention = getMeanPrevalencePostIntervention(prevalenceData, 'no_intervention');
	const noInterventionMeanCasesPer1000 = getMeanCasesPostIntervention(postInterventionCasesMap['no_intervention']) ?? 0;

	const tableMetrics: ImpactTableMetrics[] = Object.entries(casesAverted).map(
		([
			scenario,
			{ casesAvertedMeanPer1000, casesAvertedYear1Per1000, casesAvertedYear2Per1000, casesAvertedYear3Per1000 }
		]) => {
			const meanPrevalence = getMeanPrevalencePostIntervention(prevalenceData, scenario as Scenario);
			const meanCasesPer1000 = getMeanCasesPostIntervention(postInterventionCasesMap[scenario as Scenario]) ?? 0;

			return {
				intervention: ScenarioToLabel[scenario as Scenario],
				casesAvertedMeanPer1000,
				casesAvertedYear1Per1000,
				casesAvertedYear2Per1000,
				casesAvertedYear3Per1000,
				relativeReductionInCases: (casesAvertedMeanPer1000 / noInterventionMeanCasesPer1000) * 100,
				meanCasesPerYearPerPerson: meanCasesPer1000 / 1000,
				relativeReductionInPrevalence:
					((meanPrevalenceNoIntervention - meanPrevalence) / meanPrevalenceNoIntervention) * 100
			};
		}
	);

	tableMetrics.push({
		intervention: ScenarioToLabel['no_intervention'],
		meanCasesPerYearPerPerson: noInterventionMeanCasesPer1000 / 1000
	});

	return tableMetrics;
};

const ImpactTableInfo: Record<
	keyof ImpactTableMetrics,
	{ label: string; formatStyle: 'string' | 'percent' | 'decimal'; helpText?: string; fractionalDigits?: number }
> = {
	intervention: { label: 'Interventions', formatStyle: 'string' },
	casesAvertedMeanPer1000: {
		label: 'Mean cases averted per 1,000 people: Years 1-3',
		helpText:
			'The average number of cases averted each year across the three years after new interventions are implemented, relative to the no intervention scenario.',
		formatStyle: 'decimal',
		fractionalDigits: 1
	},
	casesAvertedYear1Per1000: {
		label: 'Cases averted per 1,000 people: Year 1',
		helpText: 'The number of cases averted in the first year after new interventions are implemented.',
		formatStyle: 'decimal',
		fractionalDigits: 1
	},
	casesAvertedYear2Per1000: {
		label: 'Cases averted per 1,000 people: Year 2',
		helpText: 'The number of cases averted in the second year after new interventions are implemented.',
		formatStyle: 'decimal',
		fractionalDigits: 1
	},
	casesAvertedYear3Per1000: {
		label: 'Cases averted per 1,000 people: Year 3',
		helpText: 'The number of cases averted in the third year after new interventions are implemented.',
		formatStyle: 'decimal',
		fractionalDigits: 1
	},
	relativeReductionInCases: {
		label: 'Relative reduction in clinical cases (%): Years 1-3',
		helpText:
			'The percentage reduction in clinical cases across the three years after new interventions are implemented, relative to the no intervention scenario.',
		formatStyle: 'percent',
		fractionalDigits: 1
	},
	meanCasesPerYearPerPerson: {
		label: 'Mean cases per person per year: Years 1-3',
		helpText:
			'The predicted number of clinical cases per person, averaged across the three years after new interventions are implemented.',
		formatStyle: 'decimal',
		fractionalDigits: 3
	},
	relativeReductionInPrevalence: {
		label: 'Relative reduction in prevalence (%): Years 1-3',
		helpText:
			'The percentage reduction in prevalence in under 5 year olds across the three years after new interventions are implemented, relative to the no intervention scenario.',
		formatStyle: 'percent',
		fractionalDigits: 1
	}
} as const;

export const impactTableColumns: ColumnDef<ImpactTableMetrics>[] = Object.entries(ImpactTableInfo).map(
	([key, headerInfo]) => ({
		accessorKey: key,
		cell: ({ getValue }) => {
			const value = getValue() as string | number | undefined;
			if (value === undefined || value === null) return '-';

			if (headerInfo.formatStyle === 'string') return value;

			const formatter = new Intl.NumberFormat('en-US', {
				style: headerInfo.formatStyle,
				maximumFractionDigits: headerInfo.fractionalDigits,
				minimumFractionDigits: headerInfo.fractionalDigits
			});
			const formattedValue = headerInfo.formatStyle === 'percent' ? (value as number) / 100 : (value as number);
			return formatter.format(formattedValue);
		},
		header: ({ column }) => {
			return renderComponent(DataTableSortHeader, {
				onclick: column.getToggleSortingHandler(),
				label: headerInfo.label,
				helpText: headerInfo.helpText
			});
		}
	})
);
