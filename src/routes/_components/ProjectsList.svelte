<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/';
	import type { Project } from '$lib/types';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ProjectsListDelete from './ProjectsListDelete.svelte';
	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();
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
				<ProjectsListDelete projectName={project.name} />
			</div>
			<Collapsible.Content class="space-y-2">
				{#each project.regions as region, index (index)}
					<a
						href="/projects/{project.name}/regions/{region.name}"
						class="mx-2 flex border-b py-1 font-mono text-sm hover:underline">{region.name}</a
					>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	{/each}
</div>
