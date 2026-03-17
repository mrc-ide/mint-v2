<script lang="ts">
	import { ScenarioToColor, ScenarioToLabel, type ScenarioLabel } from '$lib/charts/baseChart';
	import { createHighchart, getChartTheme } from '$lib/charts/baseChart';
	import { getCompareStrategyConfigs } from '$lib/charts/strategyConfig';
	import Loader from '$lib/components/Loader.svelte';
	import { Badge } from '$lib/components/ui/badge/index';
	import { convertToLocaleString } from '$lib/number';
	import type { CompareStrategiseResult, CompareStrategiseResults } from '$lib/types/userState';
	import { cn } from '$lib/utils';

	interface Props {
		results: NonNullable<CompareStrategiseResults>;
	}

	let { results }: Props = $props();

	let isChartsLoading = $state({
		present: true,
		longTerm: true
	});
	let presentChart: Highcharts.Chart | null = $state(null);
	let longTermChart: Highcharts.Chart | null = $state(null);
	let selectedStrategies = $state<{
		presentStrategy: null | CompareStrategiseResult[number];
		longTermStrategy: null | CompareStrategiseResult[number];
	}>({
		presentStrategy: null,
		longTermStrategy: null
	});

	let { presentConfig, longTermConfig } = getCompareStrategyConfigs(
		results,
		() => ({
			presentChart,
			longTermChart
		}),
		selectedStrategies
	);

	type SelectedCompareStrategy = CompareStrategiseResult[number] | null;

	const getStrategySummary = (strategy: SelectedCompareStrategy) => {
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

	let presentSummary = $derived(getStrategySummary(selectedStrategies.presentStrategy));
	let longTermSummary = $derived(getStrategySummary(selectedStrategies.longTermStrategy));

	let casesDelta = $derived(
		presentSummary && longTermSummary ? longTermSummary.totalCases - presentSummary.totalCases : null
	);
	let costDelta = $derived(
		presentSummary && longTermSummary ? longTermSummary.totalCost - presentSummary.totalCost : null
	);
</script>

{#snippet metricRow(label: string, value: string)}
	<div class="flex justify-between text-xs">
		<span class="text-muted-foreground">{label}:</span>
		<span class="font-medium">{value}</span>
	</div>
{/snippet}

{#snippet overviewMetric(title: string, value: string)}
	<div
		class="rounded-lg border border-border/50 bg-card p-2 text-center shadow-sm transition-all hover:border-border hover:shadow-md"
	>
		<h3 class="text-sm font-medium text-muted-foreground">{title}</h3>
		<p class="text-lg font-bold">{value}</p>
	</div>
{/snippet}

{#snippet strategyPanel(
	title: string,
	summary: {
		totalCost: number;
		totalCases: number;
		costPerCase: number;
		interventions: CompareStrategiseResult[number]['interventions'];
	}
)}
	<div class="rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm">
		<h3 class="border-b pb-2 text-lg font-semibold">{title}</h3>
		<div class="mt-3 grid grid-cols-3 gap-3">
			{@render overviewMetric('Total cost', `$${convertToLocaleString(summary.totalCost, 0)}`)}
			{@render overviewMetric('Total cases', convertToLocaleString(summary.totalCases))}
			{@render overviewMetric('Cost per case', `$${convertToLocaleString(summary.costPerCase)}`)}
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
							{@render metricRow('Cases', convertToLocaleString(intervention.cases))}
							{@render metricRow(
								'Cost per case',
								`$${convertToLocaleString(intervention.cases ? intervention.cost / intervention.cases : 0)}`
							)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex flex-1 flex-col gap-2">
	<div class="flex flex-1 gap-4">
		<div
			{@attach createHighchart(presentConfig, (chart) => {
				isChartsLoading.present = false;
				presentChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
		<div
			{@attach createHighchart(longTermConfig, (chart) => {
				isChartsLoading.longTerm = false;
				longTermChart = chart;
			})}
			class={cn(getChartTheme(), 'flex-1')}
		></div>
	</div>

	{#if isChartsLoading.present || isChartsLoading.longTerm}
		<Loader />
	{:else if presentSummary || longTermSummary}
		<div class="space-y-3">
			<div class="grid grid-cols-2 gap-4">
				{@render overviewMetric(
					'Difference in total cases',
					casesDelta === null ? 'N/A' : convertToLocaleString(casesDelta ?? 0)
				)}
				{@render overviewMetric(
					'Difference in total cost',
					costDelta === null ? 'N/A' : `$${convertToLocaleString(costDelta, 0)}`
				)}
			</div>

			<div class="grid gap-4 lg:grid-cols-2">
				{#if presentSummary}
					{@render strategyPanel('Present strategy', presentSummary)}
				{/if}
				{#if longTermSummary}
					{@render strategyPanel('Long-term strategy', longTermSummary)}
				{/if}
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-border/50 bg-card/80 p-4 text-sm text-muted-foreground shadow-sm">
			Click either chart to compare the selected present and long-term strategies.
		</div>
	{/if}
</div>
