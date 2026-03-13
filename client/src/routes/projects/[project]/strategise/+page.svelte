<script lang="ts">
	import Loader from '$lib/components/Loader.svelte';
	import * as Alert from '$lib/components/ui/alert/index';
	import { mapRegionsToPopulation } from '$lib/project';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import BudgetInput from './_components/BudgetInput.svelte';
	import StrategiseResults from './_components/StrategiseResults.svelte';
	import { strategiseSchema } from './schema';
	import { strategiseAsync } from './utils';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import CompareStrategiseResults from './_components/CompareStrategiseResults.svelte';

	let { data }: PageProps = $props();
	let loading = $state(false);
	let longTerm = $state(null);

	const form = superForm(data.form, {
		validators: zod4Client(strategiseSchema),
		resetForm: false,
		dataType: 'json',
		async onSubmit({ cancel }) {
			if ($allErrors.length > 0) {
				cancel();
				return;
			}
			loading = true;

			const { currentAverted, longTerm } = await strategiseAsync(
				$formData.minCost,
				$formData.budget,
				data.regionalStrategies,
				data.longTermRegionalStrategies
			);
			$formData.strategiseResults = currentAverted;
			$formData.compareStrategiseResults = longTerm;
		},
		onUpdated() {
			loading = false;
		}
	});
	const { form: formData, enhance, allErrors } = form;
	let populationsOfRegion = $derived(mapRegionsToPopulation(data.project.regions));
	let selectedTab = $state<'present' | 'longTerm'>('present');
</script>

<div class="mx-auto px-15 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Strategise across regions for optimal budget allocation</h1>
		<p class="mb-1 text-muted-foreground">
			This tool explores how interventions can be distributed across regions at every budget level from minimum to
			maximum. The chart shows the full range from the lowest possible budget (implementing the cheapest intervention in
			a region) up to your specified maximum budget, helping you understand trade-offs and optimal allocation strategies
			at each funding level.
		</p>
		<p class="mb-1 text-muted-foreground">
			The highest budget value permitted by the tool corresponds to implementation of the set of interventions that
			leads to the maximum cost across all regions.
		</p>
		<p class="mb-1 text-muted-foreground">
			Note that the regions must have run with interventions to be included in the strategise tool.
		</p>
	</div>
	{#if data.regionalStrategies.length > 1}
		<BudgetInput
			{form}
			bind:budget={$formData.budget}
			{enhance}
			maxCost={$formData.maxCost}
			minCost={$formData.minCost}
		/>
		{#if loading}
			<Loader />
		{:else if data.project.strategy?.results?.length}
			{#if data.userData.compareEnabled}
				<Tabs.Root bind:value={selectedTab}>
					<div class="flex gap-2">
						<Tabs.List class="w-full">
							<Tabs.Trigger value="present">Present</Tabs.Trigger>
							<Tabs.Trigger value="longTerm">Long-term</Tabs.Trigger>
						</Tabs.List>
					</div>
					<Tabs.Content value="present">
						<StrategiseResults strategiseResults={data.project.strategy.results} populations={populationsOfRegion} />
					</Tabs.Content>
					<Tabs.Content value="longTerm">
						<div class="flex items-center justify-center p-8">
							{#if data.project.compareStrategy?.results}
								<CompareStrategiseResults results={data.project.compareStrategy.results} />
							{:else}
								<div class="text-muted-foreground">Long term results are not yet available for this tool.</div>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>
			{:else}
				<StrategiseResults strategiseResults={data.project.strategy.results} populations={populationsOfRegion} />
			{/if}
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
