<script lang="ts">
	import { convertToLocaleString, sumByKey } from '$lib/number';
	import type { CompareStrategiseResult } from '$lib/types/userState';
	import CompareStrategyCard from './CompareStrategyCard.svelte';
	import OverviewMetric from './OverviewMetric.svelte';

	interface Props {
		presentStrategy: null | CompareStrategiseResult[number];
		longTermStrategy: null | CompareStrategiseResult[number];
	}

	let { presentStrategy, longTermStrategy }: Props = $props();

	const getStrategySummary = (strategy: CompareStrategiseResult[number] | null) => {
		if (!strategy) return null;

		const totalCost = sumByKey(strategy.interventions, 'cost');
		const totalCases = sumByKey(strategy.interventions, 'cases');

		return {
			totalCost,
			totalCases,
			costPerCase: totalCases ? totalCost / totalCases : 0,
			interventions: strategy.interventions
		};
	};

	let presentSummary = $derived(getStrategySummary(presentStrategy));
	let longTermSummary = $derived(getStrategySummary(longTermStrategy));

	let costDelta = $derived(
		presentSummary && longTermSummary ? longTermSummary.totalCost - presentSummary.totalCost : null
	);
</script>

{#if presentSummary || longTermSummary}
	<div class="space-y-3">
		<div>
			<OverviewMetric
				title="Difference in total cost"
				value={costDelta === null ? 'N/A' : `$${convertToLocaleString(costDelta, 0)}`}
			/>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			{#if presentSummary}
				<CompareStrategyCard title="Present strategy" summary={presentSummary} />
			{/if}
			{#if longTermSummary}
				<CompareStrategyCard title="Long-term strategy" summary={longTermSummary} />
			{/if}
		</div>
	</div>
{:else}
	<div class="rounded-lg border border-border/50 bg-card/80 p-4 text-sm text-muted-foreground shadow-sm">
		<span class="font-medium">How to compare strategies:</span> Click on any point in the charts to explore cases across
		both present and long-term strategies. The corresponding strategy on clicked chart will be compared with the closest
		strategy on the other chart where cases are less than or equal to the selected value.
	</div>
{/if}
