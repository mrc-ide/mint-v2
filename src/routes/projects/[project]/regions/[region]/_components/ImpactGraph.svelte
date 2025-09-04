<script lang="ts">
	import { createHighchart, getPrevalenceConfig } from '$lib/chart';
	import type { EmulatorResults } from '$lib/types/userState';
	import { mode } from 'mode-watcher';

	interface Props {
		emulatorResults: EmulatorResults;
	}

	// TODO: dont need full results probs
	let { emulatorResults }: Props = $props();
	$inspect(emulatorResults);
	let prevalenceConfig = $derived(getPrevalenceConfig(emulatorResults.prevalence));
	let chartTheme = $derived(mode.current === 'dark' ? 'highcharts-dark' : 'highcharts-light');
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Impact prevalence graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>

	<section aria-label="Impact cases graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
	</section>
</div>
