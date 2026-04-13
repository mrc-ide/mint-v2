<script lang="ts">
	import MetricRow from './MetricRow.svelte';
	import { Badge } from '$lib/components/ui/badge/index';
	import { convertToLocaleString } from '$lib/number';
	import { ScenarioToColor, ScenarioToLabel } from '$lib/charts/baseChart';
	import type { ScenarioLabel } from '$lib/charts/baseChart';
	import OverviewMetric from './OverviewMetric.svelte';
	import type { CompareStrategiseResult } from '$lib/types/userState';

	interface Props {
		title: string;
		summary: {
			totalCost: number;
			totalCases: number;
			costPerCase: number;
			interventions: CompareStrategiseResult[number]['interventions'];
		};
	}
	let { title, summary }: Props = $props();
</script>

<div class="rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm">
	<h3 class="border-b pb-2 text-center text-lg font-semibold">{title}</h3>
	<div class="mt-3 grid grid-cols-3 gap-3">
		<OverviewMetric title="Total cost" value={`$${convertToLocaleString(summary.totalCost, 0)}`} />
		<OverviewMetric title="Total cases" value={convertToLocaleString(summary.totalCases)} />
		<OverviewMetric title="Cost per case" value={`$${convertToLocaleString(summary.costPerCase)}`} />
	</div>

	<div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
		{#each summary.interventions as intervention (intervention.region)}
			<div
				class="group relative rounded-xl border border-border/50 bg-card/80 p-3 shadow-sm transition-all hover:border-border hover:shadow-md"
			>
				<div class="absolute top-2 right-2">
					<Badge variant="secondary" class="text-xs font-medium text-muted-foreground">
						Cost: ${convertToLocaleString(intervention.cost, 0)}
					</Badge>
				</div>

				<div class="space-y-2">
					<div>
						<h4 class="truncate pr-12 font-semibold">{intervention.region}</h4>
						<div class="mt-1 flex items-center gap-2">
							<div
								class={[
									'h-3 w-3 shrink-0 shadow-sm',
									intervention.intervention.includes('lsm') ? 'rotate-45 rounded-xs' : 'rounded-full'
								]}
								style="background-color: {ScenarioToColor[intervention.intervention]}"
							></div>
							<span class="text-sm font-medium text-muted-foreground">
								{ScenarioToLabel[intervention.intervention] as ScenarioLabel}
							</span>
						</div>
					</div>

					<div class="space-y-1.5 border-t border-border/30 pt-2">
						<MetricRow label="Cases" value={convertToLocaleString(intervention.cases)} />
						<MetricRow
							label="Cost per case"
							value={`$${convertToLocaleString(intervention.cases ? intervention.cost / intervention.cases : 0)}`}
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
