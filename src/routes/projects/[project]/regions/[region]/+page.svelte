<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-region-form';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { regionUrl } from '$lib/url';
	import type { EmulatorResults } from '$lib/types/userState';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { apiFetch } from '$lib/fetch';
	import resultsJson from '$lib/results/full.json';
	import Results from './_components/Results.svelte';
	let { data, params }: PageProps = $props();

	let isRunning = $state(false);
	let hasRunBaseline = $derived(data.region.hasRunBaseline);
	let runPromise = $derived(data.runPromise);

	const runEmulator = async (formValues: Record<string, FormValue>): Promise<EmulatorResults> => {
		console.log(formValues);
		isRunning = true;
		try {
			// const res = await apiFetch<EmulatorResults>({
			// 	url: regionUrl(params.project, params.region),
			// 	method: 'POST',
			// 	body: { formValues }
			// });

			isRunning = false;
			return resultsJson;
		} catch (e) {
			toast.error(`Failed to run emulator for region "${params.region}" in project "${params.project}"`);
			isRunning = false;
			throw e;
		}
	};
	const processCosts = (formValues: Record<string, FormValue>) => {
		// TODO: Implement cost processing logic here
		console.log(formValues);
	};
</script>

{#snippet failedLoad()}
	<div class="flex items-center justify-center p-8">
		<div class="text-destructive">Failed to load results.</div>
	</div>
{/snippet}

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
				<Results {emulatorResults} />
			{:else}
				{@render failedLoad()}
			{/if}
		{:catch _err}
			{@render failedLoad()}
		{/await}
	</DynamicForm>
{/key}
