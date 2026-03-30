<script lang="ts">
	import { convertToLocaleString, sumByKey } from '$lib/number';
	import type { StrategiseResult } from '$lib/types/userState';
	import OverviewMetric from './OverviewMetric.svelte';
	import SelectedStrategyRegionCards from './SelectedStrategyRegionCards.svelte';

	interface Props {
		selectedStrategy: StrategiseResult;
		populations: Record<string, number>;
	}
	let { selectedStrategy, populations }: Props = $props();
	let { cost, casesAverted, costPerCasesAverted } = $derived.by(() => {
		const cost = sumByKey(selectedStrategy.interventions, 'cost');
		const casesAverted = sumByKey(selectedStrategy.interventions, 'casesAverted');
		const costPerCasesAverted = cost / casesAverted;
		return {
			cost: cost,
			casesAverted: casesAverted,
			costPerCasesAverted: costPerCasesAverted
		};
	});
</script>

<div>
	<h2 class="border-b py-1 text-xl font-bold">Optimal strategy for selected budget</h2>
	<div class="mt-2 grid grid-cols-3 gap-4">
		<OverviewMetric title="Total cost of interventions" value={`$${convertToLocaleString(cost)}`} />
		<OverviewMetric title="Total cases averted" value={convertToLocaleString(casesAverted)} />
		<OverviewMetric title="Cost per case averted" value={`$${convertToLocaleString(costPerCasesAverted)}`} />
	</div>
	<SelectedStrategyRegionCards {selectedStrategy} {populations} />
</div>
