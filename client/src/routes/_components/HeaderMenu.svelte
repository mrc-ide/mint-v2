<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Menu from '@lucide/svelte/icons/menu';

	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import type { UserState } from '$lib/types/userState';

	interface Props {
		userData: UserState;
	}
	let { userData }: Props = $props();
	let compareEnabled = $state(userData.compareEnabled ?? false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" aria-label="open header menu"><Menu class="size-4.5" /></Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => goto('/privacy')}>Privacy</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => goto('/accessibility')}>Accessibility</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={() => window.open('https://mrc-ide.github.io/mint-news/', '_blank', 'noopener,noreferrer')}
		>
			News
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<form use:enhance method="POST" action="/?/setCompareEnabled" class="flex items-center space-x-2 p-1.5">
				<Switch id="compare-enabled-switch" name="compare-enabled-switch" bind:checked={compareEnabled} type="submit" />
				<Label for="compare-enabled-switch" class="text-sm">Long term planning</Label>
			</form>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
