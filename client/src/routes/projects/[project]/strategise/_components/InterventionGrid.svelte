<script lang="ts">
	import { ScenarioToColor, ScenarioToLabel } from '$lib/charts/baseChart';
	import type { Scenario, StrategiseResults } from '$lib/types/userState';
	import { convertToLocaleString } from '$lib/number';
	import { SvelteSet } from 'svelte/reactivity';
	import * as Tooltip from '$lib/components/ui/tooltip';

	interface Props {
		strategiseResults: StrategiseResults;
	}
	let { strategiseResults }: Props = $props();

	interface Block {
		intervention: Scenario;
		startCost: number;
		endCost: number;
	}

	interface RegionRow {
		region: string;
		blocks: Block[];
	}

	let triggerId = $state<string | null>(null);
	let minCost = $derived(strategiseResults[0]?.costThreshold ?? 0);
	let maxCost = $derived(strategiseResults[strategiseResults.length - 1]?.costThreshold ?? 0);
	let costRange = $derived(maxCost - minCost);

	let regions = $derived.by(() => {
		if (strategiseResults.length === 0) return [];
		return strategiseResults[0].interventions.map((i) => i.region);
	});

	let rows = $derived.by((): RegionRow[] => {
		return regions.map((region) => {
			const blocks: Block[] = [];
			let currentIntervention: Scenario | null = null;
			let blockStart = 0;

			for (let i = 0; i < strategiseResults.length; i++) {
				const result = strategiseResults[i];
				const intervention = result.interventions.find((inv) => inv.region === region);
				if (!intervention) continue;

				if (intervention.intervention !== currentIntervention) {
					if (currentIntervention !== null) {
						blocks.push({
							intervention: currentIntervention,
							startCost: blockStart,
							endCost: result.costThreshold
						});
					}
					currentIntervention = intervention.intervention;
					blockStart = result.costThreshold;
				}
			}

			if (currentIntervention !== null) {
				blocks.push({
					intervention: currentIntervention,
					startCost: blockStart,
					endCost: maxCost
				});
			}

			return { region, blocks };
		});
	});

	let legendItems = $derived.by(() => {
		const seen = new SvelteSet<Scenario>();
		for (const result of strategiseResults) {
			for (const inv of result.interventions) {
				seen.add(inv.intervention);
			}
		}
		return seen;
	});

	function getWidthPercent(block: Block): number {
		if (costRange === 0) return 100;
		return ((block.endCost - block.startCost) / costRange) * 100;
	}

	function getLeftPercent(block: Block): number {
		if (costRange === 0) return 0;
		return ((block.startCost - minCost) / costRange) * 100;
	}

	const LSM_STRIPE =
		'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--background) 7px, var(--background) 8px)';

	function getFillStyle(scenario: Scenario): string {
		const color = ScenarioToColor[scenario];
		let style = `background-color: ${color};`;
		if (scenario.includes('lsm')) {
			style += ` background-image: ${LSM_STRIPE};`;
		}
		return style;
	}

	function getBlockStyle(block: Block): string {
		const left = getLeftPercent(block);
		const width = getWidthPercent(block);
		const style = getFillStyle(block.intervention);
		return `left: ${left}%; width: ${width}%; ${style}`;
	}

	function getBlockId(region: string, block: Block): string {
		return `${region}::${block.startCost}::${block.endCost}::${block.intervention}`;
	}

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
		<div class="flex shrink-0 flex-col gap-2">
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
			<Tooltip.Provider delayDuration={200}>
				<div class="flex flex-col gap-1.5">
					{#each rows as row (row.region)}
						<!-- overflow-hidden clips blocks to the rounded container -->
						<div class="relative h-8 overflow-hidden rounded-md">
							{#each row.blocks as block (block.startCost)}
								{@const blockId = getBlockId(row.region, block)}
								<Tooltip.Root
									open={triggerId === blockId}
									onOpenChange={(open) => {
										triggerId = open ? blockId : triggerId === blockId ? null : triggerId;
									}}
								>
									<Tooltip.Trigger class="absolute inset-y-0 cursor-pointer" style={getBlockStyle(block)} />
									<Tooltip.Content
										class="rounded-md bg-background/90 text-foreground/90 shadow-lg"
										arrowClasses="bg-background/90"
									>
										<div class="flex flex-col gap-1">
											<span class="font-medium">
												{ScenarioToLabel[block.intervention]}
											</span>
											<span class="text-muted-foreground">
												${convertToLocaleString(block.startCost, 0)} - ${convertToLocaleString(block.endCost, 0)}
											</span>
										</div>
									</Tooltip.Content>
								</Tooltip.Root>
							{/each}
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
