<script lang="ts">
	// ...existing code...
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { DEFAULT_POPULATION } from '$lib/process-results/costs';
	import { collectPostInterventionCases, getAvertedCasesData } from '$lib/process-results/processCases';
	import type { EmulatorResults } from '$lib/types/userState';
	import Cost from './Cost.svelte';
	import Impact from './Impact.svelte';
	import { mode } from 'mode-watcher';

	interface Props {
		emulatorResults: EmulatorResults;
		form: Record<string, FormValue>;
	}

	let { emulatorResults, form }: Props = $props();
	let tabSelected: 'impact' | 'cost' = $state('impact');
	let chartTheme = $derived(mode.current === 'dark' ? 'highcharts-dark' : 'highcharts-light');

	const postInterventionCasesMap = $derived(collectPostInterventionCases(emulatorResults.cases));
	const casesAverted = $derived(
		getAvertedCasesData(postInterventionCasesMap, (form.population as number) || DEFAULT_POPULATION)
	);
</script>

<Tabs.Root bind:value={tabSelected} aria-label="Results tabs" class="w-full">
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
		<Cost {form} {casesAverted} {chartTheme} />
	</Tabs.Content>
</Tabs.Root>
