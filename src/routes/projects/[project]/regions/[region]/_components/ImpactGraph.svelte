<script lang="ts">
	import { createHighchart, getPrevalenceConfig } from '$lib/chart';
	import type { EmulatorResults } from '$lib/types/userState';

	interface Props {
		emulatorResults: EmulatorResults;
	}

	// TODO: dont need full results probs
	let { emulatorResults }: Props = $props();
	$inspect(emulatorResults);

	let prevalenceConfig = $derived(getPrevalenceConfig(emulatorResults.prevalence));
</script>

<div class="flex flex-col gap-6">
	<section aria-label="Impact prevalence graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)}></div>
	</section>

	<section aria-label="Impact cases graph" class="rounded-lg border p-4">
		<div {@attach createHighchart(prevalenceConfig)}></div>
	</section>
</div>
