<script lang="ts">
	import DataTable from '$lib/components/data-table/DataTable.svelte';
	import type { FormValue } from '$lib/components/dynamic-region-form/types';
	import type { CasesAverted } from '$lib/process-results/processCases';
	import { buildImpactTableData, impactTableColumns } from '$lib/tables/impactTable';
	import type { CasesData, EmulatorResults, Scenario } from '$lib/types/userState';

	interface Props {
		casesAverted: Partial<Record<Scenario, CasesAverted>>;
		emulatorResults: EmulatorResults;
		postInterventionCasesMap: Record<Scenario, CasesData[]>;
		form: Record<string, FormValue>;
	}
	let { casesAverted, emulatorResults, postInterventionCasesMap, form }: Props = $props();

	const data = $derived(buildImpactTableData(casesAverted, emulatorResults.prevalence, postInterventionCasesMap, form));
</script>

<section aria-label="Impact results table">
	<DataTable columns={impactTableColumns} {data} />
</section>
