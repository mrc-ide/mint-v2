<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';
	import * as Field from '$lib/components/ui/field';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let selectedBaselineParam = $state(data.compareParameters.baselineParameters[0]);
	let baselineSliderValue = $derived(selectedBaselineParam.value);

	const updateBaselineParam = (paramName: string) => {
		selectedBaselineParam = data.compareParameters.baselineParameters.find(
			(param) => param.parameterName === paramName
		)!;
	};
</script>

<div class="mx-auto px-4 py-2">
	<div class="mb-4">
		<h1 class="text-xl font-bold">Long term Scenario planning</h1>
		<p class="mb-1 text-muted-foreground">
			Compare the impact of current interventions versus long-term scenarios. Adjust parameters and modify intervention
			coverage percentages to see how cases and prevalence change across different budget levels.
		</p>
	</div>
	{#if data.region.hasRunBaseline}
		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-6">
				<Field.Group class="gap-4">
					<Field.Field>
						<Field.Label for="parameter-select">What do you want to adjust?</Field.Label>
						<RadioGroup.Root value={selectedBaselineParam.parameterName} onValueChange={updateBaselineParam}>
							{#each data.compareParameters.baselineParameters as param}
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
									bind:value={baselineSliderValue}
									max={selectedBaselineParam.max}
									min={selectedBaselineParam.min}
									aria-label="varying parameter slide"
									class="h-full"
								/>
								<!-- Vertical line at baseline value -->
								<div
									class="z-1.5 pointer-events-none absolute top-0 h-full w-0.5 bg-foreground/90"
									style="left: {((selectedBaselineParam.value - selectedBaselineParam.min) /
										(selectedBaselineParam.max - selectedBaselineParam.min)) *
										100}%;"
								></div>
							</div>
							<span class="text-right text-sm font-medium tabular-nums">
								{#if baselineSliderValue - selectedBaselineParam.value >= 0}+{:else}-{/if}
								{Math.abs(baselineSliderValue - selectedBaselineParam.value)}%</span
							>
						</div>
					</Field.Field>
				</Field.Group>

				<div class="flex gap-3">
					<div class="flex-1/2">prevalence graph</div>
					<div class="flex-1/2">cases graph</div>
				</div>
			</div>

			<div class="flex gap-3">Varying interventions graphs</div>
		</div>
	{:else}
		<Alert.Root variant="warning">
			<CircleAlert />
			<Alert.Title>Long term Scenario planning Unavailable</Alert.Title>
			<Alert.Description>Run the region baseline to enable long term scenario planning.</Alert.Description>
		</Alert.Root>
	{/if}
</div>
