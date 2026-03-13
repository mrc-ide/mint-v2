<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getCompareStrategyConfig } from '$lib/charts/strategyConfig';
	import type { CompareStrategiseResults } from '$lib/types/userState';

	interface Props {
		results: CompareStrategiseResults;
	}

	let { results }: Props = $props();

	let isChartsLoading = $state({
		present: true,
		longTerm: true
	});

	let presentConfig = $derived(getCompareStrategyConfig(results?.present ?? [], 'Present (current controls)'));
	let longTermConfig = $derived(getCompareStrategyConfig(results?.longTerm ?? [], 'Long-term (adjusted controls)'));

	$inspect('results present', results?.present);
</script>

<div class="flex flex-1 flex-col gap-4">
	<div {@attach createHighchart(presentConfig, () => (isChartsLoading.present = false))} class={getChartTheme()}></div>
	<div
		{@attach createHighchart(longTermConfig, () => (isChartsLoading.longTerm = false))}
		class={getChartTheme()}
	></div>
	<!-- {#if isChartLoading}
		<Loader />
	{:else}
		<SelectedStrategy {selectedStrategy} {populations} />
	{/if} -->
</div>
