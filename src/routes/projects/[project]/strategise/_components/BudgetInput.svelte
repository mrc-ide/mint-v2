<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { StrategiseForm } from '../schema';
	interface Props {
		form: SuperForm<StrategiseForm>;
		budget: number;
		enhance: SuperForm<StrategiseForm>['enhance'];
	}
	let { form, budget = $bindable(), enhance }: Props = $props();
</script>

<form method="POST" use:enhance novalidate>
	<div class="flex space-x-3">
		<Form.Field {form} name="budget">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex space-x-2">
						<Form.Label class="whitespace-nowrap" for="budget">Total available budget</Form.Label>
						<Input type="number" min={0} step={100} {...props} placeholder="Enter budget" bind:value={budget} />
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
