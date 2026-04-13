<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getCompareStrategyConfigs } from '$lib/charts/strategyConfig';
	import type { CompareStrategiseResult, CompareStrategiseResults } from '$lib/types/userState';
	import { cn } from '$lib/utils';
	import CompareSelectedStrategies from './CompareSelectedStrategies.svelte';

	interface Props {
		results: NonNullable<CompareStrategiseResults>;
	}

	let { results }: Props = $props();

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
	<h2 class="my-2 text-center text-xl font-bold">Total Clinical Cases and Cost of Strategy</h2>
	<div class="flex flex-1 gap-4">
		<div
			{@attach createHighchart(presentConfig, (chart) => {
				presentChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
		<div
			{@attach createHighchart(longTermConfig, (chart) => {
				longTermChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
	</div>

	<CompareSelectedStrategies
		presentStrategy={selectedStrategies.presentStrategy}
		longTermStrategy={selectedStrategies.longTermStrategy}
	/>
</div>
