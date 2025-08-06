<script lang="ts">
	import userGuideEN from '$lib/assets/User-Guide-en.pdf';
	import userGuideFR from '$lib/assets/User-Guide-fr.pdf';
	import type { PageProps } from './$types';
	import CreateProject from './CreateProject.svelte';
	import ProjectsList from './ProjectsList.svelte';

	let { data }: PageProps = $props();
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<p class="mb-4 leading-relaxed">
		This tool is designed to help National Malaria Control Programs explore the most cost effective option of deploying
		current World Health Organisation (WHO) recommended mosquito net and IRS products for malaria control.
	</p>
	<p class="mb-4 leading-relaxed">
		In this tool, a <strong>project</strong> is a collection of regions and a <strong>region</strong> is defined as a management
		unit - this could be an administration unit, province or village. For each region defined in the tool, there is a set
		of outputs summarising the impact and cost effectiveness of intervention packages.
	</p>
	<p class="mb-4 leading-relaxed">
		IRS is very focal and usually completed in a smaller region of a larger province or district. The model assumes that
		IRS is applied at random to the population so it is more appropriate to create separate IRS regions and non-IRS
		regions for this assessment and adjust population size accordingly.
	</p>
	<!-- TODO: need to update user guides. (do we need french still?) -->
	<p class="mb-4 leading-relaxed">
		<span class="font-semibold">For further guidance please see the </span>
		{#if data.userGuideLanguage === 'fr'}
			<a href={userGuideFR} class="text-blue-500 hover:underline">User Guide (FR)</a>
		{:else}
			<a href={userGuideEN} class="text-blue-500 hover:underline">User Guide (EN)</a>
		{/if}
	</p>
	<p class="mb-2 text-xl font-semibold">You have {data.userData.projects.length} projects</p>

	<CreateProject pageForm={data.form} />
	<ProjectsList projects={data.userData.projects} />
</div>
