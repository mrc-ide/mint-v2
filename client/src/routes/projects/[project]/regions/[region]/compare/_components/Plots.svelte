<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { createPresentPrevalenceSeries, getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { EmulatorResults } from '$lib/types/userState';

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
	let presentPrevalenceSeries = $derived(createPresentPrevalenceSeries(presentResults.prevalence));
	let prevalenceConfig = $derived(getPrevalenceConfigCompare(presentPrevalenceSeries, fullLongTermResults.prevalence));
	let casesConfig = $derived(
		getCasesCompareConfig(
			presentResults.cases,
			fullLongTermResults.cases,
			baselineLongTermResults.cases,
			presentFormValues,
			longTermFormValues
		)
	);
</script>

<div class="flex flex-3/4 flex-col gap-4">
	<section aria-label="cases compare graph" class="flex-1/2 rounded-lg border">
		<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="prevalence compare graph" class="flex-1/2 rounded-lg border">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
</div>
