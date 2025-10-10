<script lang="ts">
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getStrategyConfig } from '$lib/charts/strategyConfig';
	import Loader from '$lib/components/Loader.svelte';
	import type { StrategiseResults } from '$lib/types/userState';
	import SelectedStrategy from './SelectedStrategy.svelte';

	interface Props {
		strategiseResults: StrategiseResults[];
		populations: Record<string, number>;
	}
	let { strategiseResults, populations }: Props = $props();
	let isChartLoading = $state(true);
	let selectedStrategy = $state<StrategiseResults>(strategiseResults[strategiseResults.length - 1]);
	let config = $derived(getStrategyConfig(strategiseResults, (strategy) => (selectedStrategy = strategy)));
</script>

<div>
	<div {@attach createHighchart(config, () => (isChartLoading = false))} class={getChartTheme()}></div>
	{#if isChartLoading}
		<Loader />
	{:else}
		<SelectedStrategy {selectedStrategy} {populations} />
	{/if}
</div>
