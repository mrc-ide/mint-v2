<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { addBudgetPlotLine, getStrategyConfig } from '$lib/charts/strategyConfig';
	import Loader from '$lib/components/Loader.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import type { StrategiseResult, StrategiseResults } from '$lib/types/userState';
	import InterventionGrid from './InterventionGrid.svelte';
	import SelectedStrategy from './SelectedStrategy.svelte';

	interface Props {
		strategiseResults: StrategiseResults;
		populations: Record<string, number>;
		minCost: number;
		maxCost: number;
	}
	let { strategiseResults, populations, minCost, maxCost }: Props = $props();
	let isChartLoading = $state(true);
	let strategiseChart = $state<Highcharts.Chart | null>(null);
	let selectedStrategy = $state<StrategiseResult>(strategiseResults[strategiseResults.length - 1]);
	const selectStrategy = (strategy: StrategiseResult) => {
		selectedStrategy = strategy;
	};
	let config = $derived(getStrategyConfig(strategiseResults, selectStrategy));

	const updateStrategyAndPlotLine = (strategy: StrategiseResult) => {
		selectStrategy(strategy);
		if (!strategiseChart) return;
		addBudgetPlotLine(strategiseChart, strategy.costThreshold);
	};
</script>

<div>
	<Tabs.Root value="chart">
		<Tabs.List>
			<Tabs.Trigger value="chart">Cases Averted Chart</Tabs.Trigger>
			<Tabs.Trigger value="grid">Allocation Grid</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="chart">
			<div
				{@attach createHighchart(config, (chart) => {
					isChartLoading = false;
					strategiseChart = chart;
				})}
				class={getChartTheme()}
			></div>
			{#if isChartLoading}
				<Loader />
			{:else}
				<SelectedStrategy {selectedStrategy} {populations} />
			{/if}
		</Tabs.Content>
		<Tabs.Content value="grid">
			<InterventionGrid
				{strategiseResults}
				{minCost}
				{maxCost}
				{populations}
				{selectedStrategy}
				selectStrategy={updateStrategyAndPlotLine}
			/>
		</Tabs.Content>
	</Tabs.Root>
</div>
