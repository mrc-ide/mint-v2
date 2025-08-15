<script lang="ts">
	import DynamicFormField from './DynamicFormField.svelte';
	import { isSubGroupCollapsed } from './utils';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { SchemaField, SchemaGroup, SchemaSubGroup } from './types';
	import Info from '@lucide/svelte/icons/info';
	import { slide } from 'svelte/transition';

	interface Props {
		subGroup: SchemaSubGroup;
		group: SchemaGroup;
		collapsedSubGroups: Record<string, boolean>;
		form: Record<string, unknown>;
		errors: Record<string, string | null>;
		onFieldChange: (field: SchemaField, value: unknown) => void;
	}

	let { subGroup, group, form, collapsedSubGroups = $bindable(), errors, onFieldChange }: Props = $props();
</script>

<div class="xl:flex-1">
	<div class="mb-0.5 flex gap-2">
		{#if subGroup.collapsible}
			<button
				type="button"
				class="inline-flex items-center gap-2 font-medium hover:text-muted-foreground"
				aria-expanded={!isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id)}
				aria-controls={`subgroup-${group.id}-${subGroup.id}`}
				onclick={() =>
					(collapsedSubGroups[`${group.id}:${subGroup.id}`] = !isSubGroupCollapsed(
						collapsedSubGroups,
						group.id,
						subGroup.id
					))}
			>
				<ChevronsUpDownIcon
					class={[
						'inline-block w-5 text-center transition-transform duration-200',
						{ 'rotate-180': isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id) }
					]}
				/>
				{subGroup.title}
			</button>
		{:else}
			<h3 class="font-medium">{subGroup.title}</h3>
		{/if}
		{#if subGroup.helpText}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger><Info class="h-4 w-4 text-muted-foreground" /></Tooltip.Trigger>
					<Tooltip.Content>
						<p>{subGroup.helpText}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
	</div>

	{#if subGroup.description}<p class="mb-1 text-xs text-muted-foreground">{subGroup.description}</p>{/if}

	{#if !isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id)}
		<div id={`subgroup-${group.id}-${subGroup.id}`} class="flex flex-col gap-3" transition:slide>
			{#each subGroup.fields as field (field.id)}
				<DynamicFormField {field} {form} {errors} {onFieldChange} />
			{/each}
		</div>
	{/if}
</div>
