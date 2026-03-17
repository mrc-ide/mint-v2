<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getCompareStrategyConfigs } from '$lib/charts/strategyConfig';
	import type { CompareStrategiseResult, CompareStrategiseResults } from '$lib/types/userState';
	import { cn } from '$lib/utils';

	interface Props {
		results: NonNullable<CompareStrategiseResults>;
	}

	let { results }: Props = $props();

	let isChartsLoading = $state({
		present: true,
		longTerm: true
	});
	let presentChart: Highcharts.Chart | null = $state(null);
	let longTermChart: Highcharts.Chart | null = $state(null);
	let selectedStrategies = $state<{
		presentStrategy: null | CompareStrategiseResult[number];
		longTermStrategy: null | CompareStrategiseResult[number];
	}>({
		presentStrategy: null,
		longTermStrategy: null
	});

	let { presentConfig, longTermConfig } = getCompareStrategyConfigs(
		results,
		() => ({
			presentChart,
			longTermChart
		}),
		selectedStrategies
	);
</script>

<div class="flex flex-1 flex-col gap-2">
	<div class="flex flex-1 gap-4">
		<div
			{@attach createHighchart(presentConfig, (chart) => {
				isChartsLoading.present = false;
				presentChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
		<div
			{@attach createHighchart(longTermConfig, (chart) => {
				isChartsLoading.longTerm = false;
				longTermChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
	</div>
	<!-- {#if isChartLoading}
	<Loader />
	{:else}
	<SelectedStrategy {selectedStrategy} {populations} />
	{/if} -->
	<pre>
		{JSON.stringify(selectedStrategies, null, 2)}
	</pre>
</div>
