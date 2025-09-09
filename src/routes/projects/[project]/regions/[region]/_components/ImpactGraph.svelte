<script lang="ts">
	import { getCasesConfig } from '$lib/charts/casesConfig';
	import { createHighchart } from '$lib/charts/baseChart';
	import { getPrevalenceConfig } from '$lib/charts/prevalenceConfig';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import type { PrevalenceData, Scenario } from '$lib/types/userState';
	import { mode } from 'mode-watcher';

	interface Props {
		prevalence: PrevalenceData[];
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
	}

	let { prevalence, casesAverted }: Props = $props();
	let prevalenceConfig = $derived(getPrevalenceConfig(prevalence));
	let casesConfig = $derived(getCasesConfig(casesAverted));
	let chartTheme = $derived(mode.current === 'dark' ? 'highcharts-dark' : 'highcharts-light');
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Impact prevalence graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>

	<section aria-label="Impact cases graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
	</section>
</div>
