<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { StrategiseForm } from '../schema';
	import { convertToLocaleString } from '$lib/number';
	interface Props {
		form: SuperForm<StrategiseForm>;
		budget: number;
		enhance: SuperForm<StrategiseForm>['enhance'];
		maxCost: number;
		minCost: number;
	}
	let { form, budget = $bindable(), enhance, minCost, maxCost }: Props = $props();
	let minCostDisplay = $derived(convertToLocaleString(minCost, 0, 'ceil'));
</script>

<form method="POST" use:enhance novalidate>
	<div class="flex space-x-3">
		<Form.Field {form} name="budget" class="max-w-140">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex space-x-2">
						<Form.Label class="whitespace-nowrap" for="budget">Maximum available budget ($USD)</Form.Label>
						<Input
							type="number"
							min={minCostDisplay}
							max={maxCost}
							step={100}
							{...props}
							placeholder="$"
							bind:value={budget}
						/>
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description class="text-xs"
				>Enter your maximum budget available to you in the range <span class="font-semibold">${minCostDisplay}</span>
				to
				<span class="font-semibold">${convertToLocaleString(maxCost, 0, 'ceil')}</span>.
				<br /><span class="font-semibold">Tip:</span> Set this to the highest budget you could potentially secure to see
				all possible strategies.</Form.Description
			>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button>Explore defined budget range</Form.Button>
	</div>
</form>
