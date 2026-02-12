<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';
	import type { InterventionCompareParameter } from '$lib/types/compare';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import FieldWithChange from '$lib/components/FieldWithChange.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { slide } from 'svelte/transition';

	interface Props {
		interventionParameters: InterventionCompareParameter[];
		isLoading: boolean;
		onSliderChange: (value: number, parameterName: string) => void;
		presentFormValues: Record<string, FormValue>;
		longTermFormValues: Record<string, FormValue>;
	}

	let {
		interventionParameters,
		isLoading,
		presentFormValues,
		longTermFormValues = $bindable(),
		onSliderChange
	}: Props = $props();

	let isInterventionCollapsed = $state<Record<string, boolean>>(
		interventionParameters.reduce((acc, param) => ({ ...acc, [param.parameterName]: false }), {})
	);
</script>

<Field.Group class="gap-4">
	<div>
		<Field.Legend class="mb-2">Adjust control strategies</Field.Legend>
		<Field.Description>Update % slider, then adjust associated cost fields</Field.Description>
	</div>
	{#each interventionParameters as param (param.parameterName)}
		<Field.Field>
			<Field.Label for={`${param.parameterName}-compare-slider`}>
				<button
					type="button"
					class="flex flex-1 items-center gap-1 text-left font-semibold hover:text-muted-foreground"
					aria-expanded={!isInterventionCollapsed[param.parameterName]}
					aria-controls={`intervention-${param.parameterName}`}
					onclick={() => (isInterventionCollapsed[param.parameterName] = !isInterventionCollapsed[param.parameterName])}
				>
					<ChevronRight
						class={[
							'h-4 w-4 transition-transform duration-300',
							isInterventionCollapsed[param.parameterName] ? 'rotate-0' : 'rotate-90'
						]}
					/>
					{param.label}
				</button>
			</Field.Label>
			<SliderWithMarker
				id={`${param.parameterName}-compare-slider`}
				type="single"
				onValueChange={(value: number) => onSliderChange(value, param.parameterName)}
				max={param.max}
				min={param.min}
				disabled={isLoading}
				aria-label={`Adjust ${param.label} slider`}
				value={longTermFormValues[param.parameterName] as number}
				markerValue={presentFormValues[param.parameterName] as number}
				unit="%"
				class="h-full"
			/>
		</Field.Field>
		{#if !isInterventionCollapsed[param.parameterName]}
			<div transition:slide id={`intervention-${param.parameterName}`} class="mx-0.5 flex flex-col gap-4">
				{#each param.linkedCosts as cost (cost.costName)}
					<Field.Field>
						<Field.Label for={`${cost.costName}-compare-input`}>{cost.costLabel}</Field.Label>
						<FieldWithChange
							prefixUnit="$"
							value={longTermFormValues[cost.costName] as number}
							baseline={presentFormValues[cost.costName] as number}
						>
							<Input
								id={`${cost.costName}-compare-input`}
								type="number"
								min={0}
								step="any"
								disabled={isLoading}
								value={String(longTermFormValues[cost.costName])}
								oninput={(e) => (longTermFormValues[cost.costName] = Number(e.currentTarget.value))}
								class="flex-1"
							/>
						</FieldWithChange>
					</Field.Field>
				{/each}
			</div>
		{/if}
	{/each}
</Field.Group>
