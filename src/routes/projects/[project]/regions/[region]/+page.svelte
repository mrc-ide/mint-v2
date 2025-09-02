<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-region-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { regionUrl } from '$lib/url';
	import type { RunData } from '$lib/types/userState';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';

	let { data, params }: PageProps = $props();

	let hasRun = $derived(data.region.hasRun);
	let runPromise = $derived(data.runPromise);

	// TODO: disable inputs when processing model runs. only submit triggers info
	const runEmulator = async (formValues: Record<string, unknown>): Promise<RunData> => {
		try {
			const res = await fetch(regionUrl(params.project, params.region), {
				method: 'POST',
				body: JSON.stringify({ formValues }),
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				throw new Error('Non-OK response');
			}
			return await res.json();
		} catch (e) {
			console.error('Failed to process models:', e);
			toast.error(`Failed to process models for region "${params.region}" in project "${params.project}"`);
			throw e;
		}
	};
	const processCosts = (formValues: Record<string, FormValue>) => {
		// TODO: Implement cost processing logic here
		console.log(formValues);
	};
</script>

{#key page.url.pathname}
	<DynamicForm
		schema={data.formSchema}
		initialValues={data.region.formValues}
		bind:hasRun
		run={(formValues) => (runPromise = runEmulator(formValues))}
		process={processCosts}
		submitText="Run baseline"
	>
		{#await runPromise}
			<div class="flex items-center justify-center p-8">
				<div class="text-muted-foreground">Loading results...</div>
			</div>
		{:then runData}
			{#if runData}
				{JSON.stringify(runData)}
			{/if}
		{:catch _err}
			<div class="flex items-center justify-center p-8">
				<div class="text-destructive">Failed to load results.</div>
			</div>
		{/await}
	</DynamicForm>
{/key}
