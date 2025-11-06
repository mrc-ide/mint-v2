<script lang="ts">
	import { getChartTheme } from '$lib/charts/baseChart';

	// ...existing code...
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { collectPostInterventionCases, getAvertedCasesData } from '$lib/process-results/processCases';
	import type { EmulatorResults } from '$lib/types/userState';
	import Cost from './Cost.svelte';
	import Impact from './Impact.svelte';

	interface Props {
		emulatorResults: EmulatorResults;
		form: Record<string, FormValue>;
		activeTab: 'impact' | 'cost';
	}

	let { emulatorResults, form, activeTab = $bindable() }: Props = $props();
	let chartTheme = $derived(getChartTheme());

	const postInterventionCasesMap = $derived(collectPostInterventionCases(emulatorResults.cases));
	const casesAverted = $derived(getAvertedCasesData(postInterventionCasesMap));
	const isModelResultsInvalid = $derived.by(() => {
		if (!emulatorResults.eirValid) return true;

		return false;
	});
</script>

<Tabs.Root bind:value={activeTab} aria-label="Results tabs" class="w-full">
	<div class="flex gap-2">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="impact">Impact</Tabs.Trigger>
			<Tabs.Trigger value="cost">Cost</Tabs.Trigger>
		</Tabs.List>
	</div>
	<Tabs.Content value="impact">
		<Impact {chartTheme} {casesAverted} {emulatorResults} {postInterventionCasesMap} />
	</Tabs.Content>

	<Tabs.Content value="cost">
		{#if Object.keys(casesAverted).length === 0}
			<p class="p-4 text-center text-sm text-muted-foreground">
				Cost results are not available because no interventions were selected.
			</p>
		{:else}
			<Cost {form} {casesAverted} {chartTheme} />
		{/if}
	</Tabs.Content>
</Tabs.Root>
