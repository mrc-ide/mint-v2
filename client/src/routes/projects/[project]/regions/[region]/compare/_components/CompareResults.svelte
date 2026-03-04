<script lang="ts">
	import { createHighchart, ScenarioToLabel, type ScenarioLabel } from '$lib/charts/baseChart';
	import { getCasesCompareConfig } from '$lib/charts/casesConfig';
	import { getPrevalenceConfigCompare } from '$lib/charts/prevalenceConfig';
	import DataTable from '$lib/components/data-table/DataTable.svelte';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import Loader from '$lib/components/Loader.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { getTotalCasesAndCostsPerScenario } from '$lib/process-results/processCases';
	import { buildCompareCasesTableData, compareCasesTableColumns } from '$lib/tables/compareCasesTable';
	import type { CompareResults } from '$lib/types/compare';
	import { getScenariosFromTotals } from '../utils';

	interface Props {
		chartTheme: string;
		results: CompareResults;
		formValues: {
			presentFormValues: Record<string, FormValue>;
			longTermFormValues: Record<string, FormValue>;
		};
		isLoading: boolean;
	}
	let { chartTheme, results, formValues, isLoading }: Props = $props();

	let totals = $derived({
		presentTotals: getTotalCasesAndCostsPerScenario(results.present.cases, formValues.presentFormValues),
		baselineLongTermTotals: getTotalCasesAndCostsPerScenario(
			results.baselineLongTerm.cases,
			formValues.presentFormValues
		),
		fullLongTermTotals: getTotalCasesAndCostsPerScenario(results.fullLongTerm.cases, formValues.longTermFormValues)
	});

	let selectedIntervention = $state<ScenarioLabel>('No Intervention');
	let casesConfig = $derived(getCasesCompareConfig(totals));

	let scenarios = $derived(
		getScenariosFromTotals(totals.presentTotals, totals.baselineLongTermTotals, totals.fullLongTermTotals)
	);
	let tableData = $derived(buildCompareCasesTableData(totals, scenarios));
	let prevalenceConfig = $derived(getPrevalenceConfigCompare(results, selectedIntervention));
</script>

{#if isLoading}
	<div class="col-span-3 flex h-[500px] items-center justify-center">
		<Loader text="Loading..." />
	</div>
{:else}
	<div class="col-span-3 flex flex-col gap-4">
		<Tabs.Root value="graph">
			<div class="flex gap-2">
				<Tabs.List class="w-full">
					<Tabs.Trigger value="graph">Graph</Tabs.Trigger>
					<Tabs.Trigger value="table">Table</Tabs.Trigger>
				</Tabs.List>
			</div>
			<Tabs.Content value="graph">
				<section aria-label="cases compare graph" class="rounded-lg border p-2">
					<div {@attach createHighchart(casesConfig)} class={chartTheme}></div>
				</section>
			</Tabs.Content>
			<Tabs.Content value="table">
				<DataTable data={tableData} columns={compareCasesTableColumns} />
			</Tabs.Content>
		</Tabs.Root>
		<div class="flex flex-col gap-2">
			<Label>Select intervention to compare prevalence across timeframes:</Label>
			<RadioGroup.Root class="flex flex-wrap items-center" bind:value={selectedIntervention}>
				{#each scenarios as scenario}
					<div>
						<RadioGroup.Item value={ScenarioToLabel[scenario]} id={scenario} class="peer sr-only" />
						<Label
							for={scenario}
							class="flex cursor-pointer items-center rounded-md border p-2 text-xs not-peer-data-[state=checked]:text-muted-foreground peer-data-[state=checked]:border-primary hover:bg-accent"
						>
							{ScenarioToLabel[scenario]}
						</Label>
					</div>
				{/each}
			</RadioGroup.Root>
			<section aria-label="prevalence compare graph" class="rounded-lg border p-2">
				<div {@attach createHighchart(prevalenceConfig)} class={chartTheme}></div>
			</section>
		</div>
	</div>
{/if}
