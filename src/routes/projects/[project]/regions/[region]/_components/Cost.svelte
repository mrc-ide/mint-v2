<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getCostPer1000Config } from '$lib/charts/costsConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { DEFAULT_POPULATION, getTotalCostsPerScenario } from '$lib/process-results/costs';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import type { Scenario } from '$lib/types/userState';

	interface Props {
		form: Record<string, FormValue>;
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
		chartTheme: string;
	}
	let { form, casesAverted, chartTheme }: Props = $props();

	let totalCosts: Partial<Record<Scenario, number>> = $derived(
		getTotalCostsPerScenario(Object.keys(casesAverted) as Scenario[], form)
	);
	let costPer1000Config = $derived(
		getCostPer1000Config(totalCosts, casesAverted, Number(form.population) || DEFAULT_POPULATION)
	);
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Impact prevalence graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(costPer1000Config)} class={chartTheme}></div>
	</section>

	<!-- <section aria-label="Impact cases graph" class="rounded-lg border p-4">
			<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
		</section>
		<section aria-label="Impact results table">
			<DataTable columns={impactTableColumns} data={tableData} />
		</section> -->
</div>
