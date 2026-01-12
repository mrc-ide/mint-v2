<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getCasesConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfig } from '$lib/charts/prevalenceConfig';
	import DataTable from '$lib/components/data-table/DataTable.svelte';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import { buildImpactTableData, impactTableColumns } from '$lib/tables/impactTable';
	import type { CasesData, EmulatorResults, Scenario } from '$lib/types/userState';

	interface Props {
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
		emulatorResults: EmulatorResults;
		postInterventionCasesMap: Record<Scenario, CasesData[]>;
		chartTheme: string;
	}

	let { casesAverted, emulatorResults, postInterventionCasesMap, chartTheme }: Props = $props();
	let prevalenceConfig = $derived(getPrevalenceConfig(emulatorResults.prevalence));
	let casesConfig = $derived(getCasesConfig(casesAverted));
	const tableData = $derived(buildImpactTableData(casesAverted, emulatorResults.prevalence, postInterventionCasesMap));
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Impact prevalence graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>

	{#if Object.keys(casesAverted).length > 0}
		<section aria-label="Impact cases graph" class="rounded-lg border p-4">
			<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
		</section>
		<section aria-label="Impact results table">
			<DataTable columns={impactTableColumns} data={tableData} />
		</section>
	{/if}
</div>
