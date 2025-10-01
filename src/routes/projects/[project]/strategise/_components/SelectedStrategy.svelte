<script lang="ts">
	import type { StrategiseResults } from '$lib/types/userState';

	interface Props {
		selectedStrategy: StrategiseResults;
	}
	let { selectedStrategy }: Props = $props();

	let totalMetrics = $derived.by(() => {
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
	<div class="rounded-lg border bg-card p-2 text-center">
		<h3 class="text-sm font-medium text-muted-foreground">{title}</h3>
		<p class="text-lg font-bold">{value}</p>
	</div>
{/snippet}
<div>
	<h2 class="border-b py-1 text-xl font-bold">Optimal Strategy for Budget</h2>
	<div class="mt-2 grid grid-cols-3 gap-4">
		{@render metricCard('Total Cost', `$${totalMetrics.cost.toLocaleString('en-US', { maximumFractionDigits: 2 })}`)}
		{@render metricCard(
			'Cases Averted',
			totalMetrics.casesAverted.toLocaleString('en-US', { maximumFractionDigits: 2 })
		)}
		{@render metricCard(
			'Cost per Case Averted',
			`$${totalMetrics.costPerCasesAverted.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
		)}
	</div>

	<pre>{JSON.stringify(selectedStrategy)}</pre>
</div>
