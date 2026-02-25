<script lang="ts">
	import { createHighchart, type ScenarioLabel } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { EmulatorResults, Scenario } from '$lib/types/userState';

	interface Props {
		chartTheme: string;
		presentResults: EmulatorResults;
		presentFormValues: Record<string, FormValue>;
		longTermFormValues: Record<string, FormValue>;
		fullLongTermResults: EmulatorResults;
		baselineLongTermResults: EmulatorResults;
	}
	let {
		chartTheme,
		presentResults,
		fullLongTermResults,
		presentFormValues,
		longTermFormValues,
		baselineLongTermResults
	}: Props = $props();
	let selectedIntervention = $state<ScenarioLabel>('No Intervention');

	let prevalenceConfig = $derived(
		getPrevalenceConfigCompare(
			presentResults.prevalence,
			baselineLongTermResults.prevalence,
			fullLongTermResults.prevalence,
			selectedIntervention
		)
	);
	let casesConfig = $derived(
		getCasesCompareConfig(
			presentResults.cases,
			fullLongTermResults.cases,
			baselineLongTermResults.cases,
			presentFormValues,
			longTermFormValues,
			(intervention) => (selectedIntervention = intervention)
		)
	);
</script>

<div class="flex flex-3/4 flex-col gap-4">
	<section aria-label="cases compare graph" class="rounded-lg border p-2">
		<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
	</section>
	<section aria-label="prevalence compare graph" class="rounded-lg border p-2">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
</div>
