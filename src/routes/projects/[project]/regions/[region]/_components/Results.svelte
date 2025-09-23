<script lang="ts">
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

	const postInterventionCasesMap = $derived(collectPostInterventionCases(emulatorResults.cases));
	const casesAverted = $derived(getAvertedCasesData(postInterventionCasesMap));
</script>

<Tabs.Root bind:value={activeTab} aria-label="Results tabs" class="w-full">
	<div class="flex gap-2">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="impact">Impact</Tabs.Trigger>
			<Tabs.Trigger value="cost">Cost</Tabs.Trigger>
		</Tabs.List>
	</div>
	<Tabs.Content value="impact">
		<Impact {casesAverted} {emulatorResults} {postInterventionCasesMap} />
	</Tabs.Content>

	<Tabs.Content value="cost">
		<Cost {form} {casesAverted} />
	</Tabs.Content>
</Tabs.Root>
