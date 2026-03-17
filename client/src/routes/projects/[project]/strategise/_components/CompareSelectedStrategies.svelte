<script lang="ts">
	import { convertToLocaleString } from '$lib/number';
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

		const totalCost = strategy.interventions.reduce((sum, intervention) => sum + intervention.cost, 0);
		const totalCases = strategy.interventions.reduce((sum, intervention) => sum + intervention.cases, 0);

		return {
			totalCost,
			totalCases,
			costPerCase: totalCases ? totalCost / totalCases : 0,
			interventions: strategy.interventions
		};
	};

	let presentSummary = $derived(getStrategySummary(presentStrategy));
	let longTermSummary = $derived(getStrategySummary(longTermStrategy));

	let casesDelta = $derived(
		presentSummary && longTermSummary ? longTermSummary.totalCases - presentSummary.totalCases : null
	);
	let costDelta = $derived(
		presentSummary && longTermSummary ? longTermSummary.totalCost - presentSummary.totalCost : null
	);
</script>

{#if presentSummary || longTermSummary}
	<div class="space-y-3">
		<div class="grid grid-cols-2 gap-4">
			<OverviewMetric
				title="Difference in total cases"
				value={casesDelta === null ? 'N/A' : convertToLocaleString(casesDelta, 0)}
			/>
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
		Click either chart to compare the selected present and long-term strategies.
	</div>
{/if}
