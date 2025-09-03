<script lang="ts">
	import type { EmulatorResults } from '$lib/types/userState';
	import type { Attachment } from 'svelte/attachments';
	import Highcharts from 'highcharts';
	import { createHighchart } from '$lib/utils';

	interface Props {
		emulatorResults: EmulatorResults;
	}

	// TODO: dont need full results probs
	let { emulatorResults }: Props = $props();
	$inspect(emulatorResults);
	const config: Highcharts.Options = {
		chart: {
			type: 'bar'
		},
		title: {
			text: 'Fruit Consumption'
		},
		xAxis: {
			categories: ['Apples', 'Bananas', 'Oranges']
		},
		yAxis: {
			title: {
				text: 'Fruit eaten'
			}
		},
		series: [
			{
				name: 'Jane',
				data: [1, 0, 4],
				type: 'bar'
			},
			{
				name: 'John',
				data: [5, 7, 3],
				type: 'bar'
			}
		]
	};
</script>

<section aria-label="Impact results graph" class="rounded-lg border p-4">
	<h3 class="mb-2 text-base font-semibold">Impact — Graph</h3>
	<!-- Replace with your real graph component -->
	<div class="text-sm text-muted-foreground">Graph view of impact based on emulator results.</div>
	<div {@attach createHighchart(config)}></div>
</section>
