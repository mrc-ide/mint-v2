import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { renderComponent } from '$lib/components/ui/data-table';
import { getMeanCasesPostIntervention, type CasesAverted } from '$lib/process-results/processCases';
import { getMeanPrevalencePostIntervention } from '$lib/process-results/processPrevalence';
import type { CasesData, PrevalenceData, Scenario } from '$lib/types/userState';
import type { ColumnDef } from '@tanstack/table-core';

export const impactTableHeaders = [
	'Interventions',
	'Net use (%)',
	'IRS cover (%)',
	'Reduction in mosquitoes from LSM (%)',
	'Mean cases averted per 1,000 people annually across 3 years since intervention',
	'Cases averted per 1,000 people: Year 1 post intervention',
	'Cases averted per 1,000 people: Year 2 post intervention',
	'Cases averted per 1,000 people: Year 3 post intervention',
	'Relative reduction in clinical cases across 3 years since intervention',
	'Mean cases per person per year averaged across 3 years',
	'Relative reduction in prevalence across 36 months post intervention'
] as const;

export const ImpactTableHeaders = {
	intervention: 'Interventions',
	netUse: 'Net use (%)',
	irs: 'IRS cover (%)',
	lsm: 'Reduction in mosquitoes from LSM (%)',
	casesAvertedMean: 'Mean cases averted per 1,000 people annually across 3 years since intervention',
	casesAvertedYear1: 'Cases averted per 1,000 people: Year 1 post intervention',
	casesAvertedYear2: 'Cases averted per 1,000 people: Year 2 post intervention',
	casesAvertedYear3: 'Cases averted per 1,000 people: Year 3 post intervention',
	relativeReductionInCases: 'Relative reduction in clinical cases across 3 years since intervention',
	meanCasesPerYearPerPerson: 'Mean cases per person per year averaged across 3 years',
	relativeReductionInPrevalence: 'Relative reduction in prevalence across 36 months post intervention'
} as const;

export interface ImpactTableMetrics {
	intervention: string;
	netUse: string;
	irs: string;
	lsm: string;
	casesAvertedMean: string;
	casesAvertedYear1: string;
	casesAvertedYear2: string;
	casesAvertedYear3: string;
	relativeReductionInCases: string;
	meanCasesPerYearPerPerson: string;
	relativeReductionInPrevalence: string;
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
				netUse: scenario.includes('py') && form.itn_future ? form.itn_future + '%' : 'N/A',
				irs: scenario === 'irs_only' && form.irs_future ? form.irs_future + '%' : 'N/A',
				lsm: scenario.includes('with_lsm') && form.lsm ? form.lsm + '%' : 'N/A',
				casesAvertedMean: averageCasesAverted.toFixed(1),
				casesAvertedYear1: casesAvertedYear1.toFixed(1),
				casesAvertedYear2: casesAvertedYear2.toFixed(1),
				casesAvertedYear3: casesAvertedYear3.toFixed(1),
				relativeReductionInCases: ((averageCasesAverted / noInterventionAverageCases) * 100).toFixed(1) + '%',
				meanCasesPerYearPerPerson: (meanCasesPer1000Year / 1000).toFixed(1),
				relativeReductionInPrevalence:
					(((meanPrevalenceNoIntervention - meanPrevalence) / meanPrevalenceNoIntervention) * 100).toFixed(1) + '%'
			};
		}
	);
};

export const impactTableColumns: ColumnDef<ImpactTableMetrics>[] = Object.entries(ImpactTableHeaders).map(
	([key, headerTitle]) => ({
		accessorKey: key,
		header: ({ column }) => {
			return renderComponent(DataTableSortHeader, {
				onclick: column.getToggleSortingHandler(),
				label: headerTitle
			});
		}
	})
);
