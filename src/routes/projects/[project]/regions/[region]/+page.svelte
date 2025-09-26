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
	let { data, params }: PageProps = $props();

	let isRunning = $state(false);
	let hasRunBaseline = $derived(data.region.hasRunBaseline);
	let runPromise = $derived(data.runPromise);
	let form = $derived(data.region.formValues);
	let activeTab: 'impact' | 'cost' = $state('impact');

	const runEmulator = async (formValues: Record<string, FormValue>): Promise<EmulatorResults> => {
		isRunning = true;
		try {
			const res = await apiFetch<EmulatorResults>({
				url: regionUrl(params.project, params.region),
				method: 'POST',
				body: { formValues }
			});

			isRunning = false;
			form = formValues;
			return res.data;
		} catch (e) {
			toast.error(`Failed to run emulator for region "${params.region}" in project "${params.project}"`);
			isRunning = false;
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
		run={(formValues) => (runPromise = runEmulator(formValues))}
		process={processCosts}
		isInputsDisabled={isRunning}
		submitText="Run baseline"
	>
		{#await runPromise}
			<Loader />
		{:then emulatorResults}
			{#if emulatorResults}
				<Results {emulatorResults} {form} bind:activeTab />
			{:else}
				{@render failedLoad()}
			{/if}
		{:catch _err}
			{@render failedLoad(_err)}
		{/await}
	</DynamicForm>
{/key}
