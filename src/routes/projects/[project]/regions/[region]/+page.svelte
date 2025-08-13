<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-form';
	import type { TimeSeriesData } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	let isLoading = $state(false);
	let hasRun = $derived(data.region.hasRun);
	let timeSeries = $derived<TimeSeriesData | null>(null);

	const runModels = async (formValues: Record<string, unknown>) => {
		isLoading = true;
		const res = await fetch(`/projects/${params.project}/regions/${params.region}`, {
			method: 'POST',
			body: JSON.stringify({
				formValues
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (!res.ok) {
			toast.error(`Failed to run models for region "${params.region}" in project "${params.project}"`);
			isLoading = false;
			hasRun = false;
			return;
		}
		const data = (await res.json()) as TimeSeriesData;
		timeSeries = data;
		isLoading = false;
	};
</script>

{#snippet loading()}
	<div class="flex items-center justify-center p-8">
		<div class="text-muted-foreground">Loading results...</div>
	</div>
{/snippet}
{#snippet timeSeriesDisplay(timeSeries: TimeSeriesData)}
	CasesData: {JSON.stringify(timeSeries.casesData)}
	PrevalenceData: {JSON.stringify(timeSeries.prevalenceData)}
{/snippet}
{#key page.url.pathname}
	<DynamicForm schema={data.formSchema} initialValues={data.region.formValues} bind:hasRun {runModels}>
		{#await data.timeSeriesData}
			{@render loading()}
		{:then initialTimeSeries}
			{#if isLoading}
				{@render loading()}
			{:else if timeSeries}
				{@render timeSeriesDisplay(timeSeries)}
			{:else if initialTimeSeries}
				{@render timeSeriesDisplay(initialTimeSeries)}
			{/if}
		{:catch _err}
			<div class="flex items-center justify-center p-8">
				<div class="text-destructive">Failed to load results.</div>
			</div>
		{/await}
	</DynamicForm>
{/key}
