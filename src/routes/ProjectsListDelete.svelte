<script lang="ts">
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';

	interface Props {
		projectName: string;
	}
	let { projectName }: Props = $props();
	let isOpen = $state(false);
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'icon' })}><Trash2 /></AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. It will permanently delete the project <strong>{projectName}</strong> and all its regions.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
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
				<AlertDialog.Action
					type="submit"
					name="name"
					value={projectName}
					class={buttonVariants({ variant: 'destructive' })}>Delete</AlertDialog.Action
				>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
