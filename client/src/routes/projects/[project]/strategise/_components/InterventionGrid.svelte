<script lang="ts">
	import { ScenarioToLabel } from '$lib/charts/baseChart';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { convertToLocaleString } from '$lib/number';
	import type { Scenario, StrategiseResult, StrategiseResults } from '$lib/types/userState';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Block } from '../schema';
	import { createGridRows, getFillStyle } from '../utils';
	import SelectedStrategy from './SelectedStrategy.svelte';
	import { findClosestStrategiseResult } from '$lib/charts/strategyConfig';

	interface Props {
		strategiseResults: StrategiseResults;
		minCost: number;
		maxCost: number;
		populations: Record<string, number>;
	}
	let { strategiseResults, minCost, maxCost, populations }: Props = $props();

	let selectedStrategy = $state<StrategiseResult | null>(null);
	let linePercent = $state<number | null>(null);

	const handleGridClick = (event: MouseEvent) => {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const clampedPercent = Math.max(0, Math.min(1, percent));
		const cost = minCost + costRange * clampedPercent;
		const strategy = findClosestStrategiseResult(strategiseResults, cost);
		selectedStrategy = strategy;
		const snappedPercent = costRange === 0 ? 0 : ((strategy.costThreshold - minCost) / costRange) * 100;
		linePercent = snappedPercent;
	};

	let regionTether = Tooltip.createTether<Block>();
	let costRange = $derived(maxCost - minCost);
	let rows = $derived(createGridRows(strategiseResults, maxCost));

	let legendItems = $derived.by(() => {
		const seen = new SvelteSet<Scenario>();
		for (const row of rows) {
			for (const block of row.blocks) {
				seen.add(block.intervention);
			}
		}
		return seen;
	});

	const getBlockStyle = (block: Block): string => {
		if (costRange === 0) return '';
		const fillStyle = getFillStyle(block.intervention);
		const left = ((block.startCost - minCost) / costRange) * 100;
		const width = ((block.endCost - block.startCost) / costRange) * 100;
		return `left: ${left}%; width: ${width}%; ${fillStyle}`;
	};

	const TICK_COUNT = 8;
	let ticks = $derived.by(() => {
		const result: number[] = [];
		for (let i = 0; i <= TICK_COUNT; i++) {
			result.push(minCost + (costRange * i) / TICK_COUNT);
		}
		return result;
	});
</script>

<div class="mt-4 rounded-md border bg-card p-6 shadow-sm">
	<h3 class="mb-6 text-center text-lg font-semibold tracking-tight">Intervention Allocation by Cost of Strategy</h3>

	<div class="flex items-end gap-3">
		<!-- Region labels -->
		<div class="flex shrink-0 flex-col gap-1.5">
			{#each rows as row (row.region)}
				<div class="flex h-8 items-center justify-end text-right text-sm font-medium text-muted-foreground">
					{row.region}
				</div>
			{/each}
			<!-- spacer for x-axis -->
			<div class="h-7"></div>
		</div>

		<!-- Grid + axis -->
		<div class="min-w-0 flex-1">
			<!-- Rows -->
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="relative" onclick={handleGridClick} tabindex="0" role="button">
				<Tooltip.Provider delayDuration={100}>
					<div class="flex flex-col gap-1.5">
						{#each rows as row (row.region)}
							<div class="relative h-8 overflow-hidden rounded-md">
								<Tooltip.Root tether={regionTether}>
									{#snippet children({ payload })}
										{#each row.blocks as block (block.startCost)}
											<Tooltip.Trigger
												class="absolute inset-y-0 "
												style={getBlockStyle(block)}
												tether={regionTether}
												payload={block}
											/>
											<Tooltip.Content
												class="rounded-md bg-background/90 text-foreground/90 "
												arrowClasses="bg-background/90"
											>
												<div class="flex flex-col gap-1">
													<span class="font-medium">
														{ScenarioToLabel[payload!.intervention]}
													</span>
													<span class="text-muted-foreground">
														${convertToLocaleString(payload!.startCost, 0)} - ${convertToLocaleString(
															payload!.endCost,
															0
														)}
													</span>
												</div>
											</Tooltip.Content>
										{/each}
									{/snippet}
								</Tooltip.Root>
							</div>
						{/each}
					</div>
				</Tooltip.Provider>
				{#if linePercent !== null}
					<div
						class="pointer-events-none absolute inset-y-0 -translate-x-1/2"
						style="left: {linePercent}%; border-left: 2px dashed;"
					></div>
				{/if}
			</div>

			<!-- X-axis ticks -->
			<div class="relative mt-1 h-7 border-t border-border/60">
				{#each ticks as tick, i (tick)}
					{@const percentage = costRange === 0 ? 0 : ((tick - minCost) / costRange) * 100}
					<div
						class="absolute top-1.5 text-xs text-muted-foreground"
						style="left: {percentage}%; transform: translateX({i === ticks.length - 1
							? '-100%'
							: i === 0
								? '0%'
								: '-50%'});"
					>
						${convertToLocaleString(tick, 0)}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- X-axis label -->
	<div class="mt-1 text-center text-sm text-muted-foreground">Total cost ($USD)</div>

	<!-- Legend -->
	<div
		class="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 rounded-md border border-border/50 bg-muted/20 px-4 py-3"
	>
		{#each legendItems as scenario (scenario)}
			<div class="flex items-center gap-2 text-sm">
				<div class="h-3.5 w-5 rounded-xs" style={getFillStyle(scenario)}></div>
				<span class="text-foreground/80">{ScenarioToLabel[scenario]}</span>
			</div>
		{/each}
	</div>
	<div class="mt-2 text-start text-xs text-muted-foreground/60">
		Click anywhere on the grid to explore the optimal intervention strategy at the selected budget level
	</div>

	{#if selectedStrategy !== null}
		<div class="mt-6 border-t pt-6">
			<SelectedStrategy {selectedStrategy} {populations} />
		</div>
	{/if}
</div>
