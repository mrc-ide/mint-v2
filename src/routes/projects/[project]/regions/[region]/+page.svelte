<script lang="ts">
	import { DynamicForm } from '$lib/components/dynamic-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import type { TimeSeriesData } from '$lib/types';
	import { page } from '$app/state';

	let { data, params }: PageProps = $props();

	let loading = $state(false);
	let hasRun = $derived(data.region.hasRun);
	let timeSeriesData = $derived(data.timeSeriesData);

	const runModels = async (formValues: Record<string, unknown>) => {
		loading = true;
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
			loading = false;
			hasRun = false;
			return;
		}
		const data = (await res.json()) as TimeSeriesData;
		timeSeriesData = data;
		loading = false;
	};
</script>

{#key page.url.pathname}
	<DynamicForm schema={data.formSchema} initialValues={data.region.formValues} bind:hasRun {runModels}>
		{#if loading}
			<div class="flex items-center justify-center p-8">
				<div class="text-muted-foreground">Running models...</div>
			</div>
		{:else if timeSeriesData}
			CasesData: {JSON.stringify(timeSeriesData.casesData)}
			PrevalenceData: {JSON.stringify(timeSeriesData.prevalenceData)}
		{/if}
	</DynamicForm>
{/key}
