<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getCasesConfigCompare } from '$lib/charts/casesConfig';
	import { createPresentPrevalenceSeries, getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { EmulatorResults } from '$lib/types/userState';

	interface Props {
		chartTheme: string;
		presentResults: EmulatorResults;
		formValues: Record<string, FormValue>;
		longTermResults?: EmulatorResults;
	}
	let { chartTheme, presentResults, longTermResults, formValues }: Props = $props();
	let presentPrevalenceSeries = $derived(createPresentPrevalenceSeries(presentResults.prevalence));
	let prevalenceConfig = $derived(
		getPrevalenceConfigCompare(presentPrevalenceSeries, longTermResults?.prevalence ?? [])
	);
	let casesConfig = $derived(getCasesConfigCompare(presentResults.cases, longTermResults?.cases ?? [], formValues));
</script>

<div class="flex gap-2">
	<section aria-label="prevalence compare graph" class="flex-1/2 rounded-lg border">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="cases compare graph" class="flex-1/2 rounded-lg border">
		<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
	</section>
</div>
