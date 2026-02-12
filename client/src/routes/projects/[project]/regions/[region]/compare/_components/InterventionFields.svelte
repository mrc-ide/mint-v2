<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';
	import type { InterventionCompareParameter } from '$lib/types/compare';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import FieldWithChange from '$lib/components/FieldWithChange.svelte';

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
</script>

<Field.Group class="gap-4">
	<div>
		<Field.Legend class="mb-2">Adjust control strategies</Field.Legend>
		<Field.Description>Update % slider, then adjust associated cost fields</Field.Description>
	</div>
	{#each interventionParameters as param (param.parameterName)}
		{@const costDelta =
			(longTermFormValues[param.linkedCostName] as number) - (presentFormValues[param.linkedCostName] as number)}
		<Field.Field>
			<Field.Label for={`${param.parameterName}-compare-slider`}>{param.label}</Field.Label>
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
		<Field.Field>
			<Field.Label for={`${param.linkedCostName}-compare-input`}>{param.linkedCostLabel}</Field.Label>
			<FieldWithChange
				prefixUnit="$"
				value={longTermFormValues[param.linkedCostName] as number}
				baseline={presentFormValues[param.linkedCostName] as number}
			>
				<Input
					id={`${param.linkedCostName}-compare-input`}
					type="number"
					min={0}
					step="any"
					disabled={isLoading}
					value={String(longTermFormValues[param.linkedCostName])}
					oninput={(e) => (longTermFormValues[param.linkedCostName] = Number(e.currentTarget.value))}
					class="flex-1"
				/>
			</FieldWithChange>
		</Field.Field>
	{/each}
</Field.Group>
