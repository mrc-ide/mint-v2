<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-region-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { regionUrl } from '$lib/url';
	import type { RunData } from '$lib/types/userState';

	let { data, params }: PageProps = $props();

	let hasRun = $derived(data.region.hasRun);
	let runPromise = $derived(data.runPromise);

	const processModelRuns = async (formValues: Record<string, unknown>, triggerRun = true): Promise<RunData | null> => {
		try {
			const res = await fetch(regionUrl(params.project, params.region), {
				method: 'POST',
				body: JSON.stringify({ formValues, triggerRun }),
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				throw new Error('Non-OK response');
			}
			return await res.json();
		} catch (e) {
			console.error('Failed to process models:', e);
			toast.error(`Failed to process models for region "${params.region}" in project "${params.project}"`);
			return null;
		}
	};
</script>

{#key page.url.pathname}
	<DynamicForm
		schema={data.formSchema}
		initialValues={data.region.formValues}
		bind:hasRun
		submit={(formValues, triggerRun = true) => (runPromise = processModelRuns(formValues, triggerRun))}
		submitText="Run baseline"
	>
		{#await runPromise}
			<div class="flex items-center justify-center p-8">
				<div class="text-muted-foreground">Loading results...</div>
			</div>
		{:then runData}
			{#if runData}
				CasesData: {JSON.stringify(runData.casesData)}
				PrevalenceData: {JSON.stringify(runData.prevalenceData)}
			{/if}
		{:catch _err}
			<div class="flex items-center justify-center p-8">
				<div class="text-destructive">Failed to load results.</div>
			</div>
		{/await}
	</DynamicForm>
{/key}
