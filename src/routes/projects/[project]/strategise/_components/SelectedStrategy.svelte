<script lang="ts">
	import { ScenarioToLabel } from '$lib/charts/baseChart';
	import type { Scenario, StrategiseResults } from '$lib/types/userState';

	interface Props {
		selectedStrategy: StrategiseResults;
		populations: Record<string, number>;
	}
	let { selectedStrategy, populations }: Props = $props();

	let totalMetrics = $derived.by(() => {
		const cost = selectedStrategy.interventions.reduce((acc, cur) => acc + cur.cost, 0);
		const casesAverted = selectedStrategy.interventions.reduce((acc, cur) => acc + cur.casesAverted, 0);
		const costPerCasesAverted = cost / casesAverted;
		const interventionsByRegion = selectedStrategy.interventions.reduce(
			(acc, cur) => {
				acc[cur.region] = {
					intervention: cur.intervention,
					casesAverted: cur.casesAverted,
					cost: cur.cost,
					population: populations[cur.region],
					costPerPerson: populations[cur.region] > 0 ? cur.cost / populations[cur.region] : 0,
					costPerCaseAverted: cur.casesAverted > 0 ? cur.cost / cur.casesAverted : 0,
					casesAvertedPerPerson: populations[cur.region] > 0 ? cur.casesAverted / populations[cur.region] : 0
				};
				return acc;
			},
			{} as Record<
				string,
				{
					intervention: Scenario;
					casesAverted: number;
					cost: number;
					population: number;
					costPerPerson: number;
					costPerCaseAverted: number;
					casesAvertedPerPerson: number;
				}
			>
		);
		return {
			cost: cost,
			casesAverted: casesAverted,
			costPerCasesAverted: costPerCasesAverted,
			interventionsByRegion: interventionsByRegion
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

	<div class="mt-4">
		<h3 class="mb-2 text-lg font-semibold">Interventions by Region</h3>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each Object.entries(totalMetrics.interventionsByRegion) as [region, intervention]}
				<div class="relative rounded-lg border bg-card p-3">
					<div class="absolute top-2 right-2 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
						Pop: {intervention.population.toLocaleString('en-US')}
					</div>
					<h4 class="truncate pr-16 text-sm font-medium">{region}</h4>
					<p class="mt-1 text-xs text-muted-foreground capitalize">{ScenarioToLabel[intervention.intervention]}</p>
					<div class="mt-2 space-y-1">
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Cost:</span>
							<span class="font-medium">${intervention.cost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span
							>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Cases Averted:</span>
							<span class="font-medium"
								>{intervention.casesAverted.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span
							>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Cost per Case Averted:</span>
							<span class="font-medium"
								>${intervention.costPerCaseAverted.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span
							>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Cost per Person:</span>
							<span class="font-medium"
								>${intervention.costPerPerson.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span
							>
						</div>
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Cases Averted per Person:</span>
							<span class="font-medium"
								>{intervention.casesAvertedPerPerson.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
