<script lang="ts">
	import { ScenarioToColor, ScenarioToLabel } from '$lib/charts/baseChart';
	import { convertToLocaleString } from '$lib/number';
	import type { StrategiseResults } from '$lib/types/userState';
	import { Badge } from '$lib/components/ui/badge/index';

	interface Props {
		selectedStrategy: StrategiseResults;
		populations: Record<string, number>;
	}
	let { selectedStrategy, populations }: Props = $props();

	let regionalMetrics = $derived(
		Object.fromEntries(
			selectedStrategy.interventions.map((intervention) => [
				intervention.region,
				{
					intervention: intervention.intervention,
					casesAverted: intervention.casesAverted,
					cost: intervention.cost,
					population: populations[intervention.region],
					costPerPerson:
						populations[intervention.region] > 0 ? intervention.cost / populations[intervention.region] : 0,
					costPerCaseAverted: intervention.casesAverted > 0 ? intervention.cost / intervention.casesAverted : 0,
					casesAvertedPerPerson:
						populations[intervention.region] > 0 ? intervention.casesAverted / populations[intervention.region] : 0
				}
			])
		)
	);
</script>

{#snippet regionMetrics(label: string, value: string)}
	<div class="flex justify-between text-xs">
		<span class="text-muted-foreground">{label}:</span>
		<span class="font-medium">{value}</span>
	</div>
{/snippet}
<div class="mt-4">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
		{#each Object.entries(regionalMetrics) as [region, { casesAverted, cost, intervention, casesAvertedPerPerson, costPerCaseAverted, costPerPerson, population }]}
			<div
				class="group relative rounded-xl border border-border/50 bg-card/80 p-3 shadow-sm transition-all hover:border-border hover:shadow-md"
			>
				<div class="absolute top-2 right-2">
					<Badge variant="secondary" class="text-xs font-medium text-muted-foreground">
						Pop: {population.toLocaleString('en-US')}
					</Badge>
				</div>
				<div class="space-y-2">
					<div>
						<h4 class="truncate font-semibold">{region}</h4>
						<div class="mt-1 flex items-center gap-2">
							<div
								class={['h-3 w-3 shadow-sm', intervention.includes('lsm') ? 'rotate-45 rounded-xs' : 'rounded-full']}
								style="background-color: {ScenarioToColor[intervention]}"
							></div>
							<span class="text-sm font-medium text-muted-foreground">{ScenarioToLabel[intervention]}</span>
						</div>
					</div>
					<div class="space-y-1.5 border-t border-border/30 pt-2">
						{@render regionMetrics('Cost', `$${convertToLocaleString(cost)}`)}
						{@render regionMetrics('Cases Averted', convertToLocaleString(casesAverted))}
						{@render regionMetrics('Cost per Case Averted', `$${convertToLocaleString(costPerCaseAverted)}`)}
						{@render regionMetrics('Cost per Person', `$${convertToLocaleString(costPerPerson)}`)}
						{@render regionMetrics('Cases Averted per Person', convertToLocaleString(casesAvertedPerPerson))}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
