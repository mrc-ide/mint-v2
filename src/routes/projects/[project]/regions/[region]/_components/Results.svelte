<script lang="ts">
	// ...existing code...
	import type { EmulatorResults } from '$lib/types/userState';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ImpactGraph from './ImpactGraph.svelte';
	import ImpactTable from './ImpactTable.svelte';
	import CostGraph from './CostGraph.svelte';
	import CostTable from './CostTable.svelte';

	type Category = 'impact' | 'cost';
	type View = 'graph' | 'table';
	interface Props {
		emulatorResults: EmulatorResults;
	}

	let { emulatorResults }: Props = $props();
	let category: Category = $state('impact');
	let view: View = $state('graph');
	const combinedValue = $derived(`${category}:${view}`);
</script>

<div class="flex flex-col gap-3 md:gap-4">
	<div class="flex gap-2">
		<Tabs.Root bind:value={category} aria-label="Results category tabs" class="w-full">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="impact">Impact</Tabs.Trigger>
				<Tabs.Trigger value="cost">Cost</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		<Tabs.Root bind:value={view} aria-label="Results view tabs" class="w-full">
			<Tabs.List class="flex w-full gap-1 overflow-x-auto rounded-md bg-muted p-1 text-sm">
				<Tabs.Trigger value="graph">Graph</Tabs.Trigger>
				<Tabs.Trigger value="table">Table</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>

	<Tabs.Root value={combinedValue} aria-label="Results content panels" class="w-full">
		<Tabs.Content value="impact:graph">
			<ImpactGraph {emulatorResults} />
		</Tabs.Content>

		<Tabs.Content value="impact:table">
			<ImpactTable />
		</Tabs.Content>

		<Tabs.Content value="cost:graph">
			<CostGraph />
		</Tabs.Content>

		<Tabs.Content value="cost:table">
			<CostTable />
		</Tabs.Content>
	</Tabs.Root>
</div>
