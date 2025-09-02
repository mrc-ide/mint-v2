<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-region-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { regionUrl } from '$lib/url';
	import type { EmulatorResults } from '$lib/types/userState';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';

	let { data, params }: PageProps = $props();

	let isRunning = $state(false);
	let hasRunBaseline = $derived(data.region.hasRunBaseline);
	let runPromise = $derived(data.runPromise);

	const runEmulator = async (formValues: Record<string, unknown>): Promise<EmulatorResults> => {
		isRunning = true;
		try {
			const res = await fetch(regionUrl(params.project, params.region), {
				method: 'POST',
				body: JSON.stringify({ formValues }),
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				throw new Error('Non-OK response');
			}
			isRunning = false;
			return await res.json();
		} catch (e) {
			console.error('Failed to process models:', e);
			toast.error(`Failed to process models for region "${params.region}" in project "${params.project}"`);
			isRunning = false;
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
		bind:hasRunBaseline
		run={(formValues) => (runPromise = runEmulator(formValues))}
		process={processCosts}
		isInputsDisabled={isRunning}
		submitText="Run baseline"
	>
		{#await runPromise}
			<div class="flex items-center justify-center p-8">
				<div class="flex flex-col items-center gap-3">
					<div class="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
					<div class="text-sm text-muted-foreground">Running...</div>
				</div>
			</div>
		{:then emulatorResults}
			{#if emulatorResults}
				{JSON.stringify(emulatorResults)}
			{/if}
		{:catch _err}
			<div class="flex items-center justify-center p-8">
				<div class="text-destructive">Failed to load results.</div>
			</div>
		{/await}
	</DynamicForm>
{/key}
