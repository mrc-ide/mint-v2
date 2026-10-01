<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Loader from '$lib/components/Loader.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { Project } from '$lib/types/userState';
	import { runUploadedProjectRegions } from '$lib/uploadProject';
	import { csvTemplateUrl } from '$lib/url';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { uploadProjectSchema } from '../schema';

	interface Props {
		pageForm: SuperValidated<Infer<typeof uploadProjectSchema>, Project>;
	}

	let { pageForm }: Props = $props();
	let isOpen = $state(false);
	let regionsRun = $state(0);
	let regionsToRun = $state(0);
	let isRunning = $derived(regionsToRun > 0);

	const form = superForm(pageForm, {
		validators: zod4Client(uploadProjectSchema),
		onUpdated({ form }) {
			if (form.valid && form.message) runUploadedRegions(form.message);
		}
	});
	const { form: formData, enhance, delayed, submitting } = form;
	let isSubmittingOrRunning = $derived($submitting || isRunning);

	const runUploadedRegions = async (project: Project) => {
		regionsRun = 0;
		regionsToRun = project.regions.length;

		const failedRegions = await runUploadedProjectRegions(project, (count) => (regionsRun = count));

		regionsToRun = 0;
		isOpen = false;
		await invalidateAll();

		if (failedRegions.length) {
			toast.error(`Failed to run the emulator for: ${failedRegions.join(', ')}`);
		} else {
			toast.success(`Project "${project.name}" created with ${project.regions.length} regions!`);
		}
	};
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		if (!isSubmittingOrRunning) isOpen = open;
	}}
>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}><UploadIcon />Upload Project</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-xl" showCloseButton={!isSubmittingOrRunning}>
		<Dialog.Header>
			<Dialog.Title>Upload Project CSV</Dialog.Title>
			<Dialog.Description>
				Create a project and all of its regions from a CSV. Every value left blank uses the default for that field, so a
				CSV with baseline values only is enough to get started.
			</Dialog.Description>
		</Dialog.Header>
		{#if isRunning}
			<Loader text="Running the emulator for region {Math.min(regionsRun + 1, regionsToRun)} of {regionsToRun}..." />
		{:else if $delayed}
			<Loader text="Uploading CSV..." />
		{:else}
			<a href={csvTemplateUrl()} download class="flex w-fit items-center gap-2 text-sm text-blue-500 hover:underline">
				<DownloadIcon class="size-4" />Download the CSV template
			</a>
			<form method="POST" enctype="multipart/form-data" use:enhance action="?/upload">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label for="name">Project Name</Form.Label>
							<Input {...props} placeholder="Enter project name" bind:value={$formData.name} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="file">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label for="file">CSV File</Form.Label>
							<Input
								{...props}
								type="file"
								accept=".csv,text/csv"
								oninput={(e) => {
									const file = e.currentTarget.files?.item(0);
									$formData.file = file as File;
								}}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description
						>One row per region. The help row in the template says what each column accepts.</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>
				<Dialog.Footer>
					<Form.Button>Upload</Form.Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
