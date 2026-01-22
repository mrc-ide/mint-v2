<script lang="ts">
	import type { PageProps } from '../$types';
	import * as Field from '$lib/components/ui/field/index';
	import { Input } from '$lib/components/ui/input';

	let { data }: PageProps = $props();
	$inspect(data.region);
</script>

<div class="mx-auto px-4 py-2">
	<div class="mb-3">
		<h1 class="text-xl font-bold">Long term Scenario planning</h1>
		<p class="mb-1 text-muted-foreground">
			Compare the impact of current interventions versus long-term scenarios. Adjust parameters and modify intervention
			coverage percentages to see how cases and prevalence change across different budget levels.
		</p>
	</div>
	<div class="flex flex-col gap-3">
		<div class="flex gap-3">
			<div class="flex-1/2">prevalaence graph</div>
			<div class="flex-1/2">cases graph</div>
		</div>

		<div class="flex gap-3">Varying & interventions graphs</div>
	</div>
</div>
