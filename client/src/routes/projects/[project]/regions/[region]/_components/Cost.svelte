<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getCostConfigs } from '$lib/charts/costsConfig';
	import DataTable from '$lib/components/data-table/DataTable.svelte';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { combineCostsAndCasesAverted, getTotalCostsPerScenario } from '$lib/process-results/costs';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import { buildCostTableData, costTableColumns } from '$lib/tables/costTable';
	import type { Scenario } from '$lib/types/userState';

	interface Props {
		form: Record<string, FormValue>;
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
		chartTheme: string;
	}
	let { form, casesAverted, chartTheme }: Props = $props();

	let costsAndCasesAverted = $derived(
		combineCostsAndCasesAverted(getTotalCostsPerScenario(Object.keys(casesAverted) as Scenario[], form), casesAverted)
	);

	let { costPer1000Config, costPerCaseConfig } = $derived(
		getCostConfigs(costsAndCasesAverted, Number(form['population']))
	);
	let tableData = $derived(buildCostTableData(costsAndCasesAverted, Number(form['population'])));
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Cost per 1000 population graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(costPer1000Config)} class={chartTheme}></div>
	</section>

	<section aria-label="Cost per case graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(costPerCaseConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="Cost results table">
		<DataTable columns={costTableColumns} data={tableData} />
	</section>
</div>
