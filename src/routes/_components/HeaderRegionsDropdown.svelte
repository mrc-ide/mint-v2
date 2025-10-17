<script lang="ts">
	// This component must be used within a project and region context
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Project, Region } from '$lib/types/userState';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Plus from '@lucide/svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { addRegionSchema } from '../projects/[project]/regions/[region]/schema';

	interface Props {
		region?: Region;
		project: Project;
	}

	const { region, project }: Props = $props();
	const form = superForm(page.data.addRegionForm ?? { name: '' }, {
		validators: zodClient(addRegionSchema),
		resetForm: true,
		onResult({ result }) {
			if (result.type === 'redirect') {
				isOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;
	let isOpen = $state(false);
</script>

<DropdownMenu.Root bind:open={isOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm">
				{project.name}
				{#if region}
					- {region.name}
				{/if}
				<ChevronsUpDownIcon /></Button
			>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="max-w-64">
		{#each project.regions as region, index (index)}
			<DropdownMenu.Item>
				<a class="flex-1" href={`/projects/${project.name}/regions/${region.name}`}>{region.name}</a>
			</DropdownMenu.Item>
		{/each}
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<form class="flex flex-col gap-1" method="POST" action={`/projects/${project.name}?/addRegion`} use:enhance>
				<Label for="name" class="mx-1 my-2">Add Region</Label>
				<div class="flex gap-1.5">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Input {...props} bind:value={$formData.name} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Button variant="outline" size="icon"><Plus /></Form.Button>
				</div>
			</form>
		</DropdownMenu.Sub>
	</DropdownMenu.Content>
</DropdownMenu.Root>
