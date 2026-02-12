<script lang="ts">
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { DEBOUNCE_DELAY_MS } from '$lib/components/dynamic-region-form/utils';
	import Loader from '$lib/components/Loader.svelte';
	import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { apiFetch } from '$lib/fetch';
	import type { CompareParameters } from '$lib/types/compare';
	import type { EmulatorResults } from '$lib/types/userState';
	import { regionCompareUrl } from '$lib/url';
	import debounce from 'debounce';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import InterventionFields from './InterventionFields.svelte';
	import Plots from './Plots.svelte';

	interface Props {
		presentResults: EmulatorResults;
		compareParameters: CompareParameters;
		presentFormValues: Record<string, FormValue>;
		chartTheme: string;
		params: { project: string; region: string };
	}

	let { presentResults, compareParameters, presentFormValues, chartTheme, params }: Props = $props();
	let selectedBaselineParameter = $state(compareParameters.baselineParameters[0]);
	let fullLongTermResults = $state<EmulatorResults>(presentResults);
	let baselineLongTermResults = $derived(presentResults);
	let isLoading = $state(true);
	let longTermFormValues = $state(presentFormValues);

	const updateBaselineParam = (paramName: string) => {
		longTermFormValues[selectedBaselineParameter.parameterName] =
			presentFormValues[selectedBaselineParameter.parameterName]; // reset old param

		selectedBaselineParameter = compareParameters.baselineParameters.find(
			(param) => param.parameterName === paramName
		)!;
	};

	const runEmulator = async () => {
		isLoading = true;
		try {
			const fullLongTermPromise = apiFetch<EmulatorResults>({
				url: regionCompareUrl(params.project, params.region),
				method: 'POST',
				body: {
					formValues: longTermFormValues
				}
			});
			const baselineLongTermPromise = apiFetch<EmulatorResults>({
				url: regionCompareUrl(params.project, params.region),
				method: 'POST',
				body: {
					formValues: {
						...presentFormValues,
						[selectedBaselineParameter.parameterName]: longTermFormValues[selectedBaselineParameter.parameterName]
					}
				}
			});
			const [{ data: fullLongTermResData }, { data: baselineLongTermResData }] = await Promise.all([
				fullLongTermPromise,
				baselineLongTermPromise
			]);
			fullLongTermResults = fullLongTermResData;
			baselineLongTermResults = baselineLongTermResData;
		} catch (_err) {
			toast.error('Failed to run long term scenario planning emulator');
		} finally {
			isLoading = false;
		}
	};
	const debounceRunEmulator = debounce(runEmulator, DEBOUNCE_DELAY_MS);

	const onSliderChange = async (value: number, paramName: string) => {
		longTermFormValues[paramName] = value;
		debounceRunEmulator();
	};

	onMount(() => {
		isLoading = false;
	});
</script>

<div class="flex flex-row gap-4">
	<div class="flex w-1/4 flex-col gap-6 rounded-md border p-4">
		<Field.Group class="gap-4">
			<Field.Field>
				<Field.Label for="parameter-select">What do you want to adjust?</Field.Label>
				<RadioGroup.Root
					value={selectedBaselineParameter.parameterName}
					onValueChange={updateBaselineParam}
					disabled={isLoading}
				>
					{#each compareParameters.baselineParameters as param (param.parameterName)}
						<Field.Field orientation="horizontal">
							<RadioGroup.Item value={param.parameterName} id={param.parameterName} />
							<Field.Label for={param.parameterName}>{param.label}</Field.Label>
						</Field.Field>
					{/each}
				</RadioGroup.Root>
			</Field.Field>
			<Field.Field>
				<Field.Label for="baseline-parameter-slider">Change from baseline (%)</Field.Label>
				<SliderWithMarker
					id="baseline-parameter-slider"
					type="single"
					value={longTermFormValues[selectedBaselineParameter.parameterName] as number}
					onValueChange={(value: number) => onSliderChange(value, selectedBaselineParameter.parameterName)}
					max={selectedBaselineParameter.max}
					min={selectedBaselineParameter.min}
					disabled={isLoading}
					aria-label="Adjust baseline parameter slider"
					markerValue={presentFormValues[selectedBaselineParameter.parameterName] as number}
					unit="%"
					class="h-full"
				/>
			</Field.Field>
		</Field.Group>

		<InterventionFields
			interventionParameters={compareParameters.interventionParameters}
			{isLoading}
			{presentFormValues}
			bind:longTermFormValues
			{onSliderChange}
		/>
	</div>

	{#if isLoading}
		<div class="flex h-[500px] flex-3/4 items-center justify-center">
			<Loader text="Loading..." />
		</div>
	{:else}
		<Plots
			{chartTheme}
			{presentResults}
			{fullLongTermResults}
			{baselineLongTermResults}
			{presentFormValues}
			{longTermFormValues}
		/>
	{/if}
</div>
