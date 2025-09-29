<script lang="ts">
	import Loader from '$lib/components/Loader.svelte';
	import * as Alert from '$lib/components/ui/alert/index';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { strategiseSchema } from './schema';
	import StrategiseResults from './StrategiseResults.svelte';
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
	{#if $formData.regionalStrategies.length > 1}
		<form method="POST" use:enhance novalidate>
			<div class="flex space-x-3">
				<Form.Field {form} name="budget">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex space-x-2">
								<Form.Label class="whitespace-nowrap" for="budget">Total available budget</Form.Label>
								<Input
									type="number"
									min={0}
									step={100}
									{...props}
									placeholder="Enter budget"
									bind:value={$formData.budget}
								/>
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
	{/if}
</div>
