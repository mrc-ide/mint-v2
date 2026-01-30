<script lang="ts">
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import Loader from '$lib/components/Loader.svelte';
	import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { apiFetch } from '$lib/fetch';
	import type { CompareParameterWithValue } from '$lib/types/compare';
	import type { EmulatorResults } from '$lib/types/userState';
	import { regionCompareUrl } from '$lib/url';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import BaselinePlots from './BaselinePlots.svelte';

	interface Props {
		presentResults: EmulatorResults;
		compareBaselineParameters: CompareParameterWithValue[];
		regionFormValues: Record<string, FormValue>;
		chartTheme: string;
		params: { project: string; region: string };
	}

	let { presentResults, compareBaselineParameters, regionFormValues, chartTheme, params }: Props = $props();
	let selectedParameter = $state(compareBaselineParameters[0]);
	let sliderValue = $derived(selectedParameter.value);
	let longTermResults = $state<EmulatorResults>();
	let isLoading = $state(true);

	const updateBaselineParam = (paramName: string) => {
		selectedParameter = compareBaselineParameters.find((param) => param.parameterName === paramName)!;
		longTermResults = undefined;
	};

	const runEmulator = async () => {
		isLoading = true;
		try {
			const res = await apiFetch<EmulatorResults>({
				url: regionCompareUrl(params.project, params.region),
				method: 'POST',
				body: {
					formValues: {
						...regionFormValues,
						[selectedParameter.parameterName]: sliderValue
					}
				}
			});
			isLoading = false;
			longTermResults = res.data;
		} catch (_err) {
			toast.error('Failed to run long term scenario planning emulator');
			isLoading = false;
		}
	};

	onMount(() => {
		isLoading = false;
	});
</script>

<div class="flex flex-col gap-6">
	<Field.Group class="gap-4">
		<Field.Field>
			<Field.Label for="parameter-select">What do you want to adjust?</Field.Label>
			<RadioGroup.Root value={selectedParameter.parameterName} onValueChange={updateBaselineParam} disabled={isLoading}>
				{#each compareBaselineParameters as param (param.parameterName)}
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value={param.parameterName} id={param.parameterName} />
						<Field.Label for={param.parameterName}>{param.label}</Field.Label>
					</Field.Field>
				{/each}
			</RadioGroup.Root>
		</Field.Field>
		<Field.Field>
			<Field.Label for="baseline-parameter-slider">Change from baseline (%)</Field.Label>
			<div class="flex flex-row items-center gap-3">
				<SliderWithMarker
					id="baseline-parameter-slider"
					type="single"
					bind:value={sliderValue}
					onValueCommit={runEmulator}
					max={selectedParameter.max}
					min={selectedParameter.min}
					disabled={isLoading}
					aria-label="Adjust baseline parameter slider"
					markerValue={selectedParameter.value}
					unit="%"
					class="h-full"
				/>
				<span class="text-right text-sm font-medium tabular-nums">
					{#if sliderValue - selectedParameter.value >= 0}+{:else}-{/if}
					{Math.abs(sliderValue - selectedParameter.value)}%</span
				>
			</div>
		</Field.Field>
	</Field.Group>

	{#if isLoading}
		<Loader text="Loading..." />
	{:else}
		<BaselinePlots {chartTheme} {presentResults} {longTermResults} {regionFormValues} />
	{/if}
</div>
