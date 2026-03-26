<script lang="ts">
	import { ScenarioToLabel } from '$lib/charts/baseChart';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { convertToLocaleString } from '$lib/number';
	import type { Scenario, StrategiseResults } from '$lib/types/userState';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Block } from '../schema';
	import { createGridRows, getFillStyle } from '../utils';

	interface Props {
		strategiseResults: StrategiseResults;
		minCost: number;
		maxCost: number;
	}
	let { strategiseResults, minCost, maxCost }: Props = $props();

	let regionTether = Tooltip.createTether<Block>();
	let costRange = $derived(maxCost - minCost);
	let rows = $derived(createGridRows(strategiseResults, maxCost));

	let legendItems = $derived.by(() => {
		const seen = new SvelteSet<Scenario>();
		for (const result of strategiseResults) {
			for (const intervention of result.interventions) {
				seen.add(intervention.intervention);
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

<div class="mt-4 rounded-xl border bg-card p-6 shadow-sm">
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
			<Tooltip.Provider delayDuration={100}>
				<div class="flex flex-col gap-1.5">
					{#each rows as row (row.region)}
						<!-- overflow-hidden clips blocks to the rounded container -->
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
		class="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-3"
	>
		{#each legendItems as scenario (scenario)}
			<div class="flex items-center gap-2 text-sm">
				<div class="h-3.5 w-5 rounded" style={getFillStyle(scenario)}></div>
				<span class="text-foreground/80">{ScenarioToLabel[scenario]}</span>
			</div>
		{/each}
	</div>
</div>
