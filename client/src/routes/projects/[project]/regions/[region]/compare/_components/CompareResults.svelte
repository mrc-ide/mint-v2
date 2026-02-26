<script lang="ts">
	import { createHighchart, type ScenarioLabel } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { EmulatorResults } from '$lib/types/userState';
	import { buildCompareCasesTableData, compareCasesTableColumns } from '$lib/tables/compareCasesTable';
	import DataTable from '$lib/components/data-table/DataTable.svelte';

	export interface CompareResults {
		present: EmulatorResults;
		fullLongTerm: EmulatorResults;
		baselineLongTerm: EmulatorResults;
	}
	export interface CompareFormValues {
		presentFormValues: Record<string, FormValue>;
		longTermFormValues: Record<string, FormValue>;
	}

	interface Props {
		chartTheme: string;
		results: CompareResults;
		formValues: CompareFormValues;
	}
	let { chartTheme, results, formValues }: Props = $props();
	let selectedIntervention = $state<ScenarioLabel>('No Intervention');

	let prevalenceConfig = $derived(getPrevalenceConfigCompare(results, selectedIntervention));
	let casesConfig = $derived(
		getCasesCompareConfig(results, formValues, (intervention) => (selectedIntervention = intervention))
	);

	let tableData = $derived(buildCompareCasesTableData(results, formValues));
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
