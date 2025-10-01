<script lang="ts">
	import Loader from '$lib/components/Loader.svelte';
	import * as Alert from '$lib/components/ui/alert/index';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import BudgetInput from './_components/BudgetInput.svelte';
	import StrategiseResults from './_components/StrategiseResults.svelte';
	import { strategiseSchema } from './schema';
	let { data }: PageProps = $props();

	const form = superForm(data.form, {
		validators: zodClient(strategiseSchema),
		resetForm: false,
		dataType: 'json',
		onUpdated({ form }) {
			if (form.message && !form.valid) {
				toast.error(form.message);
			}
		}
	});
	const { form: formData, enhance, delayed } = form;
</script>

<div class="mx-auto max-w-7xl py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Strategise across regions for {data.project.name}</h1>
		<p class="mb-1 leading-relaxed text-muted-foreground">
			This tool can investigate how different interventions could be distributed across all project regions given a
			total budget, to minimise the overall number of malaria cases whilst achieving local goals.
		</p>
		<p class="mb-1 leading-relaxed text-muted-foreground">
			The regions must have run with interventions to be included in the strategise tool.
		</p>
	</div>
	{#await data.strategisePromise}
		<Loader />
	{:then strategiseResults}
		{#if strategiseResults}
			<StrategiseResults {strategiseResults} />
		{:else}
			<Alert.Root variant="warning">
				<CircleAlert />
				<Alert.Title>Strategise Tool Unavailable</Alert.Title>
				<Alert.Description
					>At least two regions must have run with interventions to use the strategise tool.</Alert.Description
				>
			</Alert.Root>
		{/if}
	{:catch err}
		<div class="flex flex-col items-center justify-center gap-2 p-8">
			<div class="text-destructive">Failed to load strategise results.</div>
			{#if err}
				<div class="text-sm text-destructive">{err.message}</div>
			{/if}
		</div>
	{/await}

	<!-- {#if $formData.regionalStrategies.length > 1}
		<BudgetInput {form} bind:budget={$formData.budget} {enhance} />
		{#if $delayed}
			<Loader />
		{/if}

		{#if data.project.strategy.results}
			<StrategiseResults strategiseResults={data.project.strategy.results} />
		{/if}
	{:else}
		<Alert.Root variant="warning">
			<CircleAlert />
			<Alert.Title>Strategise Tool Unavailable</Alert.Title>
			<Alert.Description
				>At least two regions must have run with interventions to use the strategise tool.</Alert.Description
			>
		</Alert.Root>
	{/if} -->
</div>
