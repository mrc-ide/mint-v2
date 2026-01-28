<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { createPresentPrevalenceSeries, getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { EmulatorResults } from '$lib/types/userState';

	interface Props {
		chartTheme: string;
		presentResults: EmulatorResults;
		longTermResults?: EmulatorResults;
	}
	let { chartTheme, presentResults, longTermResults }: Props = $props();
	let presentPrevalenceSeries = $derived(createPresentPrevalenceSeries(presentResults.prevalence));
	let prevalenceConfig = $derived(
		getPrevalenceConfigCompare(presentPrevalenceSeries, longTermResults?.prevalence ?? [])
	);
</script>

<div class="flex gap-2">
	<section aria-label="Impact prevalence graph" class="flex-1/2 rounded-lg border">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
	<div class="flex-1/2">cases graph</div>
</div>
