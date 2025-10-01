<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getStrategyConfig } from '$lib/charts/strategyConfig';
	import type { StrategiseResults } from '$lib/types/userState';
	import SelectedStrategy from './SelectedStrategy.svelte';

	interface Props {
		strategiseResults: StrategiseResults[];
	}
	let { strategiseResults }: Props = $props();
	let selectedStrategy = $state<StrategiseResults>();

	const setStrategy = (strategy: StrategiseResults) => (selectedStrategy = strategy);

	let config = $derived(getStrategyConfig(strategiseResults, setStrategy));

	$inspect(selectedStrategy);
</script>

<div class="flex flex-col">
	<div {@attach createHighchart(config)}></div>
	{#if selectedStrategy}
		<SelectedStrategy {selectedStrategy} />
	{/if}
</div>
