<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/';
	import type { Project } from '$lib/types';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ProjectsListDelete from './ProjectsListDelete.svelte';
	import { navigating } from '$app/state';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();
</script>

<div class="mt-2">
	{#each projects as { name, regions }, index (index)}
		<Collapsible.Root class="mb-2 space-y-2 border-b">
			<div class="flex items-center justify-between space-x-4">
				<Collapsible.Trigger class="flex flex-1 items-center space-x-0.5 hover:text-muted-foreground">
					<div class="text-muted-foreground">
						<ChevronsUpDownIcon size={20} />
						<span class="sr-only">Toggle</span>
					</div>
					<h4 class="font-semibold">
						{name}
						<span class="text-sm font-normal">({regions.length} regions)</span>
					</h4>
				</Collapsible.Trigger>
				<ProjectsListDelete projectName={name} />
			</div>
			<Collapsible.Content class="space-y-2">
				{#each regions as region, index (index)}
					{@const params = navigating.to?.params}
					<a
						href="/projects/{name}/regions/{region.name}"
						class="mx-2 flex gap-2 border-b py-1 font-mono text-sm hover:underline"
						>{region.name}
						{#if params?.project === name && params?.region === region.name}
							<LoaderCircle class="h-4 w-4 animate-spin" />
						{/if}</a
					>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	{/each}
</div>
