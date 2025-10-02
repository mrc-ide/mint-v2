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
		<Form.Field {form} name="budget">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex space-x-2">
						<Form.Label class="whitespace-nowrap" for="budget">Total available budget (USD)</Form.Label>
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
			<Form.Description
				>Enter budget between ${minCost.toLocaleString()} and ${maxCost.toLocaleString()} (constrained by intervention costs)</Form.Description
			>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button>Strategise</Form.Button>
	</div>
</form>
