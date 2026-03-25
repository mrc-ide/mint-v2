<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getStrategyConfig } from '$lib/charts/strategyConfig';
	import Loader from '$lib/components/Loader.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import type { StrategiseResult, StrategiseResults } from '$lib/types/userState';
	import InterventionGrid from './InterventionGrid.svelte';
	import SelectedStrategy from './SelectedStrategy.svelte';

	interface Props {
		strategiseResults: StrategiseResults;
		populations: Record<string, number>;
	}
	let { strategiseResults, populations }: Props = $props();
	let isChartLoading = $state(true);
	let selectedStrategy = $state<StrategiseResult>(strategiseResults[strategiseResults.length - 1]);
	let config = $derived(getStrategyConfig(strategiseResults, (strategy) => (selectedStrategy = strategy)));
</script>

<div>
	<Tabs.Root value="chart">
		<Tabs.List>
			<Tabs.Trigger value="chart">Cases Averted Chart</Tabs.Trigger>
			<Tabs.Trigger value="grid">Allocation Grid</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="chart">
			<div {@attach createHighchart(config, () => (isChartLoading = false))} class={getChartTheme()}></div>
			{#if isChartLoading}
				<Loader />
			{:else}
				<SelectedStrategy {selectedStrategy} {populations} />
			{/if}
		</Tabs.Content>
		<Tabs.Content value="grid">
			<InterventionGrid {strategiseResults} />
		</Tabs.Content>
	</Tabs.Root>
</div>
