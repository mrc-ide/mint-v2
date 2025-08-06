<script lang="ts">
	import userGuideEN from '$lib/assets/User-Guide-en.pdf';
	import userGuideFR from '$lib/assets/User-Guide-fr.pdf';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { TagsInput } from '$lib/components/ui/TagsInput';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './schema';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();
	let isOpen = $state(false);

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		onUpdated({ form }) {
			if (form.valid) {
				toast.success('Project created successfully!');
				isOpen = false;
			}
		}
	});
	const { form: formData, enhance } = form;
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

	<!-- TODO: do as table. name, regions (collapsible), delete button -->
	<!-- TODO: remember project + region names can contain spaces (may need to hyphenate ) -->
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'default' })}><PlusIcon />Create Project</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-xl">
			<Dialog.Header>
				<Dialog.Title>Create Project</Dialog.Title>
				<Dialog.Description>Create a new project by entering a name and listing regions.</Dialog.Description>
			</Dialog.Header>
			<form method="POST" use:enhance>
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Label for="name">Project Name</Label>
							<Input {...props} placeholder="Enter project name" bind:value={$formData.name} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="regions">
					<Form.Control>
						{#snippet children({ props })}
							<Label for="regions">Regions</Label>
							<TagsInput {...props} bind:tags={$formData.regions} onlyUnique={true} placeholder="Enter region names" />
						{/snippet}
					</Form.Control>
					<Form.Description>Add regions by pressing Enter. Backspace to remove.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Dialog.Footer>
					<Form.Button>Create</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
	<div>
		{#each data.userData.projects as project}
			<div class="flex border-b border-gray-200 py-4">
				<h3 class="text-lg font-semibold">{project.name}</h3>
			</div>
		{/each}
	</div>
</div>
