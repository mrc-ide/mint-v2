<script lang="ts">
	import type { PageProps } from '../$types';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';

	let { data }: PageProps = $props();
	let selectedParameter = $state('current_malaria_prevalence'); // get from server
	let sliderValue = $state(10);
	$inspect(data);
</script>

<div class="mx-auto px-4 py-2">
	<div class="mb-4">
		<h1 class="text-xl font-bold">Long term Scenario planning</h1>
		<p class="mb-1 text-muted-foreground">
			Compare the impact of current interventions versus long-term scenarios. Adjust parameters and modify intervention
			coverage percentages to see how cases and prevalence change across different budget levels.
		</p>
	</div>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-3 pl-2">
				<div class="flex flex-col gap-2">
					<p class="font-medium">What do you want to adjust?</p>
					<RadioGroup.Root bind:value={selectedParameter} class="flex flex-row gap-4">
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="current_malaria_prevalence" id="current_malaria_prevalence" />
							<Label for="current_malaria_prevalence">Prevalence (%)</Label>
						</div>
					</RadioGroup.Root>
				</div>

				<div class="flex flex-col gap-2">
					<p class="font-medium">Change from baseline (%)</p>
					<div class="flex flex-row items-center gap-4">
						<Slider
							type="single"
							bind:value={sliderValue}
							max={70}
							min={2}
							aria-label="varying parameter slide"
							class="w-64"
						/>
						<Label class="w-10 text-right text-sm tabular-nums">{sliderValue}%</Label>
					</div>
				</div>
			</div>

			<div class="flex gap-3">
				<div class="flex-1/2">prevalaence graph</div>
				<div class="flex-1/2">cases graph</div>
			</div>
		</div>

		<div class="flex gap-3">Varying interventions graphs</div>
	</div>
</div>
