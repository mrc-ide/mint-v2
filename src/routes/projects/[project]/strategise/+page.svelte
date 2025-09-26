<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import {
		collectPostInterventionCases,
		convertPer1000ToTotal,
		getAvertedCasesData,
		type CasesAverted
	} from '$lib/process-results/processCases';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { strategiseSchema, type StrategiseRegions } from './schema';
	import type { Scenario } from '$lib/types/userState';
	import { z } from 'zod';
	import {
		combineCostsAndCasesAverted,
		DEFAULT_POPULATION,
		getTotalCostsPerScenario
	} from '$lib/process-results/costs';

	let { data }: PageProps = $props();

	const form = superForm(data.form, {
		validators: zodClient(strategiseSchema),
		resetForm: false,
		dataType: 'json'
	});
	const { form: formData, enhance } = form;

	const allCasesAvertedData = $derived.by(() => {
		const allCasesAvertedData: Record<string, Partial<Record<Scenario, CasesAverted>>> = {};

		for (const region of data.project.regions) {
			const postInterventionCases = collectPostInterventionCases(region.cases);
			const casesAverted = getAvertedCasesData(postInterventionCases);
			if (Object.keys(casesAverted).length > 0) {
				allCasesAvertedData[region.name] = casesAverted;
			}
		}

		return allCasesAvertedData;
	});

	let casesAvertedAndCostsPerRegion: StrategiseRegions = $derived.by(() => {
		const result: StrategiseRegions = [];
		for (const [region, casesAvertedForRegion] of Object.entries(allCasesAvertedData)) {
			const regionForm = data.project.regions.find((r) => r.name === region)?.formValues ?? {};
			const costsAndCasesAverted = combineCostsAndCasesAverted(
				getTotalCostsPerScenario(Object.keys(casesAvertedForRegion) as Scenario[], regionForm),
				casesAvertedForRegion
			);

			const interventions: StrategiseRegions[number]['interventions'] = [];
			for (const [scenario, { casesAverted, totalCost }] of Object.entries(costsAndCasesAverted)) {
				interventions.push({
					intervention: scenario,
					cost: totalCost,
					casesAverted: convertPer1000ToTotal(
						casesAverted.totalAvertedCasesPer1000,
						Number(regionForm.population) || DEFAULT_POPULATION
					)
				});
			}
			result.push({
				region,
				interventions
			});
		}

		return result;
	});

	$inspect(casesAvertedAndCostsPerRegion);
</script>

<div class="mx-auto max-w-7xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Strategise across regions for {data.project.name}</h1>
		<p class="mb-1 leading-relaxed text-muted-foreground">
			This tool can investigate how different interventions could be distributed across wider regions to minimise the
			overall number of malaria cases whilst achieving local goals.
		</p>
		<p class="mb-1 leading-relaxed text-muted-foreground">
			The regions must have run with interventions to be included in the strategise tool.
		</p>
	</div>
	{#if Object.keys(allCasesAvertedData).length > 1}
		<form method="POST" use:enhance>
			<div class="flex space-x-3">
				<Form.Field {form} name="budget">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex space-x-2">
								<Form.Label class="whitespace-nowrap" for="budget">Total available budget</Form.Label>
								<Input type="number" step={100} {...props} placeholder="Enter budget" bind:value={$formData.budget} />
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description
						>The total budget available to distribute across all regions over the 3-year period.</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button>Strategise</Form.Button>
			</div>
		</form>
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
