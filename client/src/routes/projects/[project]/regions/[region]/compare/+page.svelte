<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import type { PageProps } from './$types';
	import Compare from './_components/Compare.svelte';
	import { getChartTheme } from '$lib/charts/baseChart';
	import Loader from '$lib/components/Loader.svelte';

	let { data, params }: PageProps = $props();
	let chartTheme = $derived(getChartTheme());
</script>

<div class="mx-auto px-4 py-2">
	<div class="mb-4">
		<h1 class="text-xl font-bold">Long term Scenario planning</h1>
		<p class="mb-1 text-muted-foreground">
			Compare the impact of control strategies now and in the future following a change to the local epidemiology.
			Explore how this impacts disease burden and the cost of maintaining control.
		</p>
	</div>
	{#if data.region.hasRunBaseline && data.region.results}
		{#await data.longTermResults}
			<div class="flex items-center justify-center">
				<Loader />
			</div>
		{:then longTermResults}
			<Compare
				{params}
				{chartTheme}
				presentFormValues={data.region.formValues}
				compareParameters={data.compareParameters}
				presentResults={data.region.results}
				{longTermResults}
				savedLongTermFormValues={data.region.longTermFormValues}
			/>
		{:catch _e}
			<div class="flex flex-col items-center justify-center gap-2 p-8">
				<div class="text-destructive">Failed to load long term results.</div>
			</div>
		{/await}
	{:else}
		<Alert.Root variant="warning">
			<CircleAlert />
			<Alert.Title>Long term Scenario planning Unavailable</Alert.Title>
			<Alert.Description>Run the region baseline to enable long term scenario planning.</Alert.Description>
		</Alert.Root>
	{/if}
</div>
