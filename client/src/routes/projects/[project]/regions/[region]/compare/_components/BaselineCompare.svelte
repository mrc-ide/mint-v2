<script lang="ts">
	import { createHighchart } from '$lib/charts/baseChart';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { DEBOUNCE_DELAY_MS } from '$lib/components/dynamic-region-form/utils';
	import Loader from '$lib/components/Loader.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';
	import { apiFetch } from '$lib/fetch';
	import type { CompareParameterWithValue } from '$lib/types/compare';
	import type { EmulatorResults } from '$lib/types/userState';
	import { runEmulatorUrl } from '$lib/url';
	import debounce from 'debounce';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		currentResults: EmulatorResults;
		compareBaselineParameters: CompareParameterWithValue[];
		formValues: Record<string, FormValue>;
		chartTheme: string;
	}
	let { currentResults, compareBaselineParameters, formValues, chartTheme }: Props = $props();
	let selectedParameter = $state(compareBaselineParameters[0]);
	let sliderValue = $derived(selectedParameter.value);
	let prevalenceConfig = $derived(getPrevalenceConfigCompare(currentResults.prevalence, []));

	let isLoading = $state(true);

	const updateBaselineParam = (paramName: string) => {
		selectedParameter = compareBaselineParameters.find((param) => param.parameterName === paramName)!;
		prevalenceConfig = getPrevalenceConfigCompare(currentResults.prevalence, []);
	};
	const updateSliderValue = (value: number) => {
		sliderValue = value;
		debounceRunEmulator();
	};

	const runEmulator = async () => {
		isLoading = true;
		try {
			const res = await apiFetch<EmulatorResults>({
				url: runEmulatorUrl(),
				method: 'POST',
				body: {
					...formValues,
					[selectedParameter.parameterName]: sliderValue
				}
			});
			isLoading = false;
			prevalenceConfig = getPrevalenceConfigCompare(currentResults.prevalence, res.data.prevalence);
		} catch (err) {
			toast.error('Failed to run long term scenario planning emulator');
			isLoading = false;
		}
	};
	const debounceRunEmulator = debounce(runEmulator, DEBOUNCE_DELAY_MS);

	onMount(() => {
		isLoading = false;
	});
</script>

<div class="flex flex-col gap-6">
	<Field.Group class="gap-4">
		<Field.Field>
			<Field.Label for="parameter-select">What do you want to adjust?</Field.Label>
			<RadioGroup.Root value={selectedParameter.parameterName} onValueChange={updateBaselineParam} disabled={isLoading}>
				{#each compareBaselineParameters as param}
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value={param.parameterName} id={param.parameterName} />
						<Field.Label for={param.parameterName}>{param.label}</Field.Label>
					</Field.Field>
				{/each}
			</RadioGroup.Root>
		</Field.Field>
		<Field.Field>
			<Field.Label for="parameter-slider">Change from baseline (%)</Field.Label>
			<div class="flex flex-row items-center gap-3">
				<div class="relative h-8 w-64">
					<Slider
						type="single"
						value={sliderValue}
						onValueChange={updateSliderValue}
						max={selectedParameter.max}
						min={selectedParameter.min}
						disabled={isLoading}
						aria-label="varying parameter slide"
						class="h-full"
					/>
					<div
						class="z-1.5 pointer-events-none absolute top-0 h-full w-0.5 bg-foreground/90"
						style="left: {((selectedParameter.value - selectedParameter.min) /
							(selectedParameter.max - selectedParameter.min)) *
							100}%;"
					></div>
				</div>
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
		<div class="flex gap-2">
			<section aria-label="Impact prevalence graph" class="flex-1/2 rounded-lg border">
				<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
			</section>
			<div class="flex-1/2">cases graph</div>
		</div>
	{/if}
</div>
