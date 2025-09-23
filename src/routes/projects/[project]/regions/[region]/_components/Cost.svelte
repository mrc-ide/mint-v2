<script lang="ts">
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import { getTotalCostsPerScenario } from '$lib/process-results/costs';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import type { Scenario } from '$lib/types/userState';

	interface Props {
		form: Record<string, FormValue>;
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
	}
	let { form, casesAverted }: Props = $props();

	let totalCosts: Partial<Record<Scenario, number>> = $derived(
		getTotalCostsPerScenario(Object.keys(casesAverted) as Scenario[], form)
	);
</script>

<section aria-label="Cost results graph" class="rounded-lg border p-4">
	<h3 class="mb-2 text-base font-semibold">Cost</h3>
	<!-- TODO: tables + graphs -->
	{JSON.stringify(totalCosts, null, 2)}
</section>
