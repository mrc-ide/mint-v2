<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { slide } from 'svelte/transition';
	import InfoTooltip from '../InfoTooltip.svelte';
	import DynamicFormField from './DynamicFormField.svelte';
	import type { FormValue, SchemaField, SchemaGroup, SchemaSubGroup } from './types';
	import { isSubGroupCollapsed } from './utils';

	interface Props {
		subGroup: SchemaSubGroup;
		group: SchemaGroup;
		collapsedSubGroups: Record<string, boolean>;
		form: Record<string, FormValue>;
		errors: Record<string, string | null>;
		onFieldChange: (field: SchemaField, value: FormValue) => void;
		isInputsDisabled: boolean;
	}

	let {
		subGroup,
		group,
		form,
		collapsedSubGroups = $bindable(),
		errors,
		onFieldChange,
		isInputsDisabled
	}: Props = $props();
</script>

<div class="xl:flex-1">
	<div class="mb-1 flex gap-2">
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
				<ChevronRight
					class={[
						'h-4 w-4 transition-transform duration-300',
						isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id) ? 'rotate-0' : 'rotate-90'
					]}
				/>
				{subGroup.title}
			</button>
		{:else}
			<h3 class="font-medium">{subGroup.title}</h3>
		{/if}
		{#if subGroup.helpText}
			<InfoTooltip text={subGroup.helpText} />
		{/if}
	</div>

	{#if subGroup.description}<p class="mb-2 text-xs text-muted-foreground">{subGroup.description}</p>{/if}

	{#if !isSubGroupCollapsed(collapsedSubGroups, group.id, subGroup.id)}
		<div id={`subgroup-${group.id}-${subGroup.id}`} class="flex flex-col gap-5" transition:slide>
			{#each subGroup.fields as field (field.id)}
				<DynamicFormField {field} {form} {errors} {onFieldChange} {isInputsDisabled} />
			{/each}
		</div>
	{/if}
</div>
