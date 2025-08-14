<script lang="ts">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import DynamicFormSubGroup from './DynamicFormSubGroup.svelte';
	import { slide } from 'svelte/transition';
	import { isGroupCollapsed } from './utils';
	import type { SchemaField, SchemaGroup } from './types';
	import Info from '@lucide/svelte/icons/info';

	interface Props {
		group: SchemaGroup;
		form: Record<string, unknown>;
		collapsedGroups: Record<string, boolean>;
		collapsedSubGroups: Record<string, boolean>;
		errors: Record<string, string | null>;
		onFieldChange: (field: SchemaField, value: unknown) => void;
	}

	let {
		group,
		form,
		collapsedGroups = $bindable(),
		collapsedSubGroups = $bindable(),
		errors,
		onFieldChange
	}: Props = $props();
</script>

<section class={['rounded-md border', group.preRun ? 'col-span-4 p-10' : 'col-span-1 col-start-1 p-5']}>
	<div class="flex gap-2">
		{#if group.collapsible}
			<button
				type="button"
				class="inline-flex items-center gap-1 text-left text-lg font-semibold hover:text-muted-foreground"
				aria-expanded={!isGroupCollapsed(collapsedGroups, group)}
				aria-controls={`group-${group.id}`}
				onclick={() => (collapsedGroups[group.id] = !isGroupCollapsed(collapsedGroups, group))}
			>
				<ChevronsUpDownIcon
					class={[
						'inline-block w-5 text-center transition-transform duration-200',
						{ 'rotate-180': isGroupCollapsed(collapsedGroups, group) }
					]}
				/>
				{group.title}
			</button>
		{:else if group.title}<h2 class="mb-1 text-lg font-semibold">{group.title}</h2>{/if}
		{#if group.helpText}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger><Info class="h-4 w-4 text-muted-foreground" /></Tooltip.Trigger>
					<Tooltip.Content>
						<p>{group.helpText}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
	</div>
	{#if group.description}<p class="mb-1 text-sm text-muted-foreground">{group.description}</p>{/if}

	{#if !isGroupCollapsed(collapsedGroups, group)}
		<div
			id={`group-${group.id}`}
			transition:slide
			class={['mx-2 flex justify-between gap-5', group.preRun ? 'flex-row' : 'flex-col']}
		>
			{#each group.subGroups as subGroup}
				<DynamicFormSubGroup {subGroup} {group} {form} bind:collapsedSubGroups {errors} {onFieldChange} />
			{/each}
		</div>
	{/if}
</section>
