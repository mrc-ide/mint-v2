<script lang="ts">
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/';
	import type { Project } from '$lib/types';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();
	let isOpen = $state(false);
</script>

<div class="mt-2">
	{#each projects as project, index (index)}
		<Collapsible.Root class="mb-2 space-y-2 border-b">
			<div class="flex items-center justify-between space-x-4">
				<Collapsible.Trigger class="flex flex-1 items-center space-x-0.5 hover:text-muted-foreground">
					<div class="text-muted-foreground">
						<ChevronsUpDownIcon size={20} />
						<span class="sr-only">Toggle</span>
					</div>
					<h4 class="font-semibold">
						{project.name}
						<span class="text-sm font-normal">({project.regions.length} regions)</span>
					</h4>
				</Collapsible.Trigger>
				<AlertDialog.Root bind:open={isOpen}>
					<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'icon' })}
						><Trash2 /></AlertDialog.Trigger
					>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description>
								This action cannot be undone. It will permanently delete the project <strong>{project.name}</strong> and
								all its regions.
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
									>Delete</AlertDialog.Action
								>
							</form>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
			<Collapsible.Content class="space-y-2">
				{#each project.regions as region, index (index)}
					<a
						href="/projects/{project.name}/regions/{region.name}"
						class="flex border-b px-2 py-1 font-mono text-sm hover:underline">{region.name}</a
					>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	{/each}
</div>
