<script lang="ts">
	import { convertToLocaleString } from '$lib/number';
	import type { StrategiseResults } from '$lib/types/userState';
	import SelectedStrategyRegionCards from './SelectedStrategyRegionCards.svelte';

	interface Props {
		selectedStrategy: StrategiseResults;
		populations: Record<string, number>;
	}
	let { selectedStrategy, populations }: Props = $props();
	let { cost, casesAverted, costPerCasesAverted } = $derived.by(() => {
		const cost = selectedStrategy.interventions.reduce((acc, cur) => acc + cur.cost, 0);
		const casesAverted = selectedStrategy.interventions.reduce((acc, cur) => acc + cur.casesAverted, 0);
		const costPerCasesAverted = cost / casesAverted;
		return {
			cost: cost,
			casesAverted: casesAverted,
			costPerCasesAverted: costPerCasesAverted
		};
	});
</script>

{#snippet metricCard(title: string, value: string)}
	<div
		class="rounded-lg border border-border/50 bg-card bg-gradient-to-br from-card to-card/80 p-2 text-center shadow-sm transition-all hover:border-border hover:shadow-md"
	>
		<h3 class="text-sm font-medium text-muted-foreground">{title}</h3>
		<p class="text-lg font-bold">{value}</p>
	</div>
{/snippet}
<div>
	<h2 class="border-b py-1 text-xl font-bold">Optimal Strategy for explored budget</h2>
	<div class="mt-2 grid grid-cols-3 gap-4">
		{@render metricCard('Total Cost', `$${convertToLocaleString(cost)}`)}
		{@render metricCard('Cases Averted', convertToLocaleString(casesAverted))}
		{@render metricCard('Cost per Case Averted', `$${convertToLocaleString(costPerCasesAverted)}`)}
	</div>
	<SelectedStrategyRegionCards {selectedStrategy} {populations} />
</div>
