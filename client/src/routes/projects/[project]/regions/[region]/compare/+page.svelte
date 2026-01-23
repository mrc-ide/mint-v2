<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	import type { PageProps } from '../$types';

	let { data }: PageProps = $props();
</script>

<div class="mx-auto px-4 py-2">
	<div class="mb-4">
		<h1 class="text-xl font-bold">Long term Scenario planning</h1>
		<p class="mb-1 text-muted-foreground">
			Compare the impact of current interventions versus long-term scenarios. Adjust parameters and modify intervention
			coverage percentages to see how cases and prevalence change across different budget levels.
		</p>
	</div>
	{#if data.region.hasRunBaseline}
		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-3">
				<div class="flex flex-col gap-3 pl-2">parameters selection</div>

				<div class="flex gap-3">
					<div class="flex-1/2">prevalaence graph</div>
					<div class="flex-1/2">cases graph</div>
				</div>
			</div>

			<div class="flex gap-3">Varying interventions graphs</div>
		</div>
	{:else}
		<Alert.Root variant="warning">
			<CircleAlert />
			<Alert.Title>Long term Scenario planning Unavailable</Alert.Title>
			<Alert.Description>Run the region baseline to enable long term scenario planning.</Alert.Description>
		</Alert.Root>
	{/if}
</div>
