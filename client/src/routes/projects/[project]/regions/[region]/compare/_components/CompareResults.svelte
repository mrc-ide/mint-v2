<script lang="ts">
	import { createHighchart, type ScenarioLabel } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import DataTable from '$lib/components/data-table/DataTable.svelte';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { getTotalCasesAndCostsPerScenario } from '$lib/process-results/processCases';
	import { buildCompareCasesTableData, compareCasesTableColumns } from '$lib/tables/compareCasesTable';
	import type { CompareResults } from '$lib/types/compare';

	interface Props {
		chartTheme: string;
		results: CompareResults;
		formValues: {
			presentFormValues: Record<string, FormValue>;
			longTermFormValues: Record<string, FormValue>;
		};
	}
	let { chartTheme, results, formValues }: Props = $props();

	let totals = $derived({
		presentTotals: getTotalCasesAndCostsPerScenario(results.present.cases, formValues.presentFormValues),
		baselineLongTermTotals: getTotalCasesAndCostsPerScenario(
			results.baselineLongTerm.cases,
			formValues.presentFormValues
		),
		fullLongTermTotals: getTotalCasesAndCostsPerScenario(results.fullLongTerm.cases, formValues.longTermFormValues)
	});

	let selectedIntervention = $state<ScenarioLabel>('No Intervention');
	let casesConfig = $derived(getCasesCompareConfig(totals, (intervention) => (selectedIntervention = intervention)));

	let tableData = $derived(buildCompareCasesTableData(totals));

	let prevalenceConfig = $derived(getPrevalenceConfigCompare(results, selectedIntervention));
</script>

<div class="flex flex-3/4 flex-col gap-4">
	<section aria-label="cases compare graph" class="rounded-lg border p-2">
		<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="prevalence compare graph" class="rounded-lg border p-2">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="cases compare table">
		<DataTable data={tableData} columns={compareCasesTableColumns} />
	</section>
</div>
