<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { StrategiseForm } from '../schema';
	interface Props {
		form: SuperForm<StrategiseForm>;
		budget: number;
		enhance: SuperForm<StrategiseForm>['enhance'];
		maxCost: number;
		minCost: number;
	}
	let { form, budget = $bindable(), enhance, minCost, maxCost }: Props = $props();
</script>

<form method="POST" use:enhance novalidate>
	<div class="flex space-x-3">
		<Form.Field {form} name="budget" class="max-w-140">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex space-x-2">
						<Form.Label class="whitespace-nowrap" for="budget">Maximum available budget (USD)</Form.Label>
						<Input
							type="number"
							min={minCost}
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
				>Enter your maximum possible budget between <span class="font-semibold">${minCost.toLocaleString()}</span> and
				<span class="font-semibold">${maxCost.toLocaleString()}</span>.
				<br /><span class="font-semibold">Tip:</span> Set this to the highest budget you could potentially secure to see
				all possible strategies.</Form.Description
			>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button>Show Full Budget Range</Form.Button>
	</div>
</form>
