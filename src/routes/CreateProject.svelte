<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Form from '$lib/components/ui/form';
	import { TagsInput } from '$lib/components/ui/TagsInput';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createProjectSchema } from './schema';
	import { Input } from '$lib/components/ui/input';
	interface Props {
		pageForm: SuperValidated<Infer<typeof createProjectSchema>>;
	}

	let { pageForm }: Props = $props();
	const form = superForm(pageForm, {
		validators: zodClient(createProjectSchema),
		onUpdated({ form }) {
			if (form.valid) {
				toast.success('Project created successfully!');
				isOpen = false;
			}
		}
	});
	const { form: formData, enhance, errors } = form;
	let isOpen = $state(false);
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class={buttonVariants({ variant: 'default' })}><PlusIcon />Create Project</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>Create Project</Dialog.Title>
			<Dialog.Description>Create a new project by entering a name and listing regions.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" use:enhance action="?/create">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="name">Project Name</Form.Label>
						<Input {...props} placeholder="Enter project name" bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="regions">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="regions">Regions</Form.Label>
						<TagsInput
							{...props}
							bind:tags={$formData.regions}
							onlyUnique={true}
							placeholder="Enter region names"
							onDuplicate={(tag: string) => {
								$errors.regions = { _errors: [`Region "${tag}" already exists`] };
							}}
						/>
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
