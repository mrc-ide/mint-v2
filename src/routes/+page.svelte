<script lang="ts">
	import { enhance } from '$app/forms';
	import userGuideEN from '$lib/assets/User-Guide-en.pdf';
	import userGuideFR from '$lib/assets/User-Guide-fr.pdf';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import CreateProject from './CreateProject.svelte';

	let { data }: PageProps = $props();
	let isOpen = $state(false);
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
	<div class="mt-2">
		{#each data.userData.projects as project}
			<Collapsible.Root class="mb-2 space-y-2 border-b">
				<div class="flex items-center justify-between space-x-4">
					<div class="space-x- flex items-center justify-between space-x-1.5">
						<Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}>
							<ChevronsUpDownIcon />
							<span class="sr-only">Toggle</span>
						</Collapsible.Trigger>
						<h4 class="font-semibold">
							{project.name}
							<span class="text-sm font-medium text-muted-foreground">({project.regions.length} regions)</span>
						</h4>
					</div>
					<AlertDialog.Root bind:open={isOpen}>
						<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'icon' })}
							><Trash2 /></AlertDialog.Trigger
						>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
								<AlertDialog.Description>
									This action cannot be undone. This will permanently delete your account and remove your data from our
									servers.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
								<form
									method="POST"
									action="?/delete"
									use:enhance={({ formData }) => {
										formData.append('name', project.name);

										return async ({ update, result }) => {
											console.log(result);
											if (result.type === 'success') {
												isOpen = false;
												await update();
												toast.success('Project deleted successfully');
											} else {
												toast.error('Failed to delete project');
											}
										};
									}}
								>
									<AlertDialog.Action type="submit" class={buttonVariants({ variant: 'destructive' })}
										>Continue</AlertDialog.Action
									>
								</form>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				</div>
				<Collapsible.Content class="space-y-2">
					{#each project.regions as region}
						<a
							href="/projects/{project.name}/regions/{region.name}"
							class="flex border-b px-2 py-1 font-mono text-sm hover:underline">{region.name}</a
						>
					{/each}
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</div>
</div>
