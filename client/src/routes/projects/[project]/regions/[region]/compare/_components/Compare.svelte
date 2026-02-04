<script lang="ts">
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { DEBOUNCE_DELAY_MS } from '$lib/components/dynamic-region-form/utils';
	import Loader from '$lib/components/Loader.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { apiFetch } from '$lib/fetch';
	import type { CompareParametersWithValue } from '$lib/types/compare';
	import type { EmulatorResults } from '$lib/types/userState';
	import { regionCompareUrl } from '$lib/url';
	import debounce from 'debounce';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Plots from './Plots.svelte';
	import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';

	interface Props {
		presentResults: EmulatorResults;
		compareParameters: CompareParametersWithValue;
		regionFormValues: Record<string, FormValue>;
		chartTheme: string;
		params: { project: string; region: string };
	}

	let { presentResults, compareParameters, regionFormValues, chartTheme, params }: Props = $props();
	let selectedBaselineParameter = $state(compareParameters.baselineParameters[0]);
	let baselineSliderValue = $derived(selectedBaselineParameter.value);
	let longTermResults = $state<EmulatorResults>();
	let isLoading = $state(true);

	let interventionSliderValues = $state(
		compareParameters.interventionParameters.reduce(
			(acc, param) => {
				acc[param.parameterName] = param.value;
				return acc;
			},
			{} as Record<string, number>
		)
	);

	const updateBaselineParam = (paramName: string) => {
		selectedBaselineParameter = compareParameters.baselineParameters.find(
			(param) => param.parameterName === paramName
		)!;
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
						[selectedBaselineParameter.parameterName]: baselineSliderValue,
						...interventionSliderValues
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
	const debounceRunEmulator = debounce(runEmulator, DEBOUNCE_DELAY_MS);

	const onInterventionSliderChange = async (value: number, paramName: string) => {
		interventionSliderValues[paramName] = value;
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
					bind:value={baselineSliderValue}
					onValueChange={debounceRunEmulator}
					max={selectedBaselineParameter.max}
					min={selectedBaselineParameter.min}
					disabled={isLoading}
					aria-label="Adjust baseline parameter slider"
					markerValue={selectedBaselineParameter.value}
					unit="%"
					class="h-full"
				/>
			</Field.Field>
		</Field.Group>

		<Field.Group class="gap-4">
			<Field.Legend>Alternative control strategies</Field.Legend>
			{#each compareParameters.interventionParameters as param (param.parameterName)}
				<Field.Field>
					<Field.Label for={param.parameterName}>{param.label}</Field.Label>
					<SliderWithMarker
						id={param.parameterName}
						type="single"
						onValueChange={(value: number) => {
							onInterventionSliderChange(value, param.parameterName);
						}}
						max={param.max}
						min={param.min}
						disabled={isLoading}
						aria-label={`Adjust ${param.label} slider`}
						value={interventionSliderValues[param.parameterName]}
						markerValue={param.value}
						unit="%"
						class="h-full"
					/>
				</Field.Field>
			{/each}
		</Field.Group>
	</div>

	{#if isLoading}
		<div class="flex h-[500px] flex-3/4 items-center justify-center">
			<Loader text="Loading..." />
		</div>
	{:else}
		<Plots {chartTheme} {presentResults} {longTermResults} {regionFormValues} />
	{/if}
</div>
