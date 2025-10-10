<script lang="ts">
	import Loader from '$lib/components/Loader.svelte';
	import * as Alert from '$lib/components/ui/alert/index';
	import { mapRegionsToPopulation } from '$lib/project';
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
	let populationsOfRegion = $derived(mapRegionsToPopulation(data.project.regions));
</script>

<div class="mx-auto px-15 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Strategise across regions for optimal budget allocation</h1>
		<p class="mb-1 text-muted-foreground">
			This tool explores how interventions can be distributed across regions at every budget level from minimum to
			maximum. The chart shows the full range from the lowest possible budget up to your specified maximum budget,
			helping you understand trade-offs and optimal allocation strategies at each funding level.
		</p>
		<p class="mb-1 text-muted-foreground">
			The regions must have run with interventions to be included in the strategise tool.
		</p>
	</div>
	{#if $formData.regionalStrategies.length > 1}
		<BudgetInput
			{form}
			bind:budget={$formData.budget}
			{enhance}
			maxCost={$formData.maxCost}
			minCost={$formData.minCost}
		/>
		{#if $delayed}
			<Loader />
		{:else if data.project.strategy?.results}
			<StrategiseResults strategiseResults={data.project.strategy.results} populations={populationsOfRegion} />
		{/if}
	{:else}
		<Alert.Root variant="warning">
			<CircleAlert />
			<Alert.Title>Strategise Tool Unavailable</Alert.Title>
			<Alert.Description
				>At least two regions must have run with interventions to use the strategise tool.</Alert.Description
			>
		</Alert.Root>
	{/if}
</div>
