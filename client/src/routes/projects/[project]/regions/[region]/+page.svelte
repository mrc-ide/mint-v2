<script lang="ts">
	import { page } from '$app/state';
	import { DynamicForm } from '$lib/components/dynamic-region-form';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { apiFetch } from '$lib/fetch';
	import type { EmulatorResults } from '$lib/types/userState';
	import { regionUrl } from '$lib/url';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import Results from './_components/Results.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	let { data, params }: PageProps = $props();

	let isRunning = $state(true);
	let runError = $state<Error>();
	let hasRunBaseline = $derived(data.region.hasRunBaseline);
	let emulatorResults = $derived(data.region.results);
	let form = $derived(data.region.formValues);
	let activeTab: 'impact' | 'cost' = $state('impact');

	const runEmulator = async (formValues: Record<string, FormValue>): Promise<void> => {
		isRunning = true;
		try {
			await apiFetch<EmulatorResults>({
				url: regionUrl(params.project, params.region),
				method: 'POST',
				body: { formValues }
			});

			isRunning = false;
			invalidateAll(); // rerun load to get updated results
		} catch (e) {
			toast.error(`Failed to run emulator for region "${params.region}" in project "${params.project}"`);
			isRunning = false;
			runError = e as Error;
			throw e;
		}
	};
	const processCosts = async (formValues: Record<string, FormValue>) => {
		form = formValues;
		try {
			await apiFetch({
				url: regionUrl(params.project, params.region),
				method: 'PATCH',
				body: { formValues }
			});
		} catch (_e) {
			toast.error('Failed to save form state');
		}
	};

	// hydration complete can render the results
	onMount(() => {
		isRunning = false;
	});
</script>

{#snippet failedLoad(err?: Error)}
	<div class="flex flex-col items-center justify-center gap-2 p-8">
		<div class="text-destructive">Failed to load results.</div>
		{#if err}
			<div class="text-sm text-destructive">{err.message}</div>
		{/if}
	</div>
{/snippet}

{#key page.url.pathname}
	<DynamicForm
		schema={data.formSchema}
		initialValues={data.region.formValues}
		bind:hasRunBaseline
		run={(formValues) => runEmulator(formValues)}
		process={processCosts}
		isInputsDisabled={isRunning}
		submitText="Run baseline"
	>
		{#if isRunning}
			<Loader text="Running..." />
		{:else if runError && !emulatorResults}
			{@render failedLoad(runError)}
		{:else if emulatorResults}
			<Results {emulatorResults} {form} bind:activeTab />
		{/if}
	</DynamicForm>
{/key}
