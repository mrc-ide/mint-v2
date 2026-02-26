<script lang="ts">
	import { createHighchart, type ScenarioLabel } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { EmulatorResults } from '$lib/types/userState';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { buildCompareCasesTableData, compareCasesTableColumns } from '$lib/tables/compareCasesTable';
	import DataTable from '$lib/components/data-table/DataTable.svelte';

	interface Props {
		chartTheme: string;
		presentResults: EmulatorResults;
		presentFormValues: Record<string, FormValue>;
		longTermFormValues: Record<string, FormValue>;
		fullLongTermResults: EmulatorResults;
		baselineLongTermResults: EmulatorResults;
	}
	let {
		chartTheme,
		presentResults,
		fullLongTermResults,
		presentFormValues,
		longTermFormValues,
		baselineLongTermResults
	}: Props = $props();
	let selectedIntervention = $state<ScenarioLabel>('No Intervention');

	let prevalenceConfig = $derived(
		getPrevalenceConfigCompare(
			presentResults.prevalence,
			baselineLongTermResults.prevalence,
			fullLongTermResults.prevalence,
			selectedIntervention
		)
	);
	let casesConfig = $derived(
		getCasesCompareConfig(
			presentResults.cases,
			fullLongTermResults.cases,
			baselineLongTermResults.cases,
			presentFormValues,
			longTermFormValues,
			(intervention) => (selectedIntervention = intervention)
		)
	);

	let tableData = $derived(
		buildCompareCasesTableData(
			presentResults.cases,
			fullLongTermResults.cases,
			baselineLongTermResults.cases,
			presentFormValues,
			longTermFormValues
		)
	);
</script>

<div class="flex flex-3/4 flex-col">
	<Tabs.Root value="plot">
		<div class="flex gap-2">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="plot">Plots</Tabs.Trigger>
				<Tabs.Trigger value="table">Table</Tabs.Trigger>
			</Tabs.List>
		</div>
		<Tabs.Content value="plot" class="flex flex-col gap-4">
			<section aria-label="cases compare graph" class="rounded-lg border p-2">
				<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
			</section>
			<section aria-label="prevalence compare graph" class="rounded-lg border p-2">
				<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
			</section>
		</Tabs.Content>
		<Tabs.Content value="table">
			<DataTable data={tableData} columns={compareCasesTableColumns} />
		</Tabs.Content>
	</Tabs.Root>
</div>
