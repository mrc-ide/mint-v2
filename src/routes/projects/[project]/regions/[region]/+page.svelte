<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	let hasRun = $derived(data.region.hasRun);
	let runPromise = $derived(data.runDataPromise);

	const runModels = async (formValues: Record<string, unknown>, rerun = true) => {
		try {
			const res = await fetch(`/projects/${params.project}/regions/${params.region}`, {
				method: 'POST',
				body: JSON.stringify({ formValues, rerun }),
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				throw new Error('Non-OK response');
			}
			return await res.json();
		} catch (e) {
			toast.error(`Failed to run models for region "${params.region}" in project "${params.project}"`);
			hasRun = false;
		}
	};
</script>

{#key page.url.pathname}
	<DynamicForm
		schema={data.formSchema}
		initialValues={data.region.formValues}
		bind:hasRun
		submit={(formValues, rerun = true) => (runPromise = runModels(formValues, rerun))}
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
