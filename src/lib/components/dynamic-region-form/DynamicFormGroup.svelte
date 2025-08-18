<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import { slide } from 'svelte/transition';
	import InfoTooltip from '../InfoTooltip.svelte';
	import DynamicFormSubGroup from './DynamicFormSubGroup.svelte';
	import type { SchemaField, SchemaGroup } from './types';
	import { isGroupCollapsed } from './utils';

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
	<div class="flex gap-4">
		{#if group.collapsible}
			<button
				type="button"
				class="inline-flex items-center gap-1 text-left text-lg font-semibold hover:text-muted-foreground"
				aria-expanded={!isGroupCollapsed(collapsedGroups, group)}
				aria-controls={`group-${group.id}`}
				onclick={() => (collapsedGroups[group.id] = !isGroupCollapsed(collapsedGroups, group))}
			>
				{#if isGroupCollapsed(collapsedGroups, group)}
					<ChevronRight class="h-4 w-4" />
				{:else}
					<ChevronDown class="h-4 w-4" />
				{/if}
				{group.title}
			</button>
		{:else if group.title}<h2 class="mb-2 text-lg font-semibold">{group.title}</h2>{/if}
		{#if group.helpText}
			<InfoTooltip text={group.helpText} />
		{/if}
	</div>
	{#if group.description}<p class="mb-2 text-sm text-muted-foreground">{group.description}</p>{/if}

	{#if !isGroupCollapsed(collapsedGroups, group)}
		<div
			id={`group-${group.id}`}
			transition:slide
			class={['mx-2 flex justify-between gap-6 xl:gap-x-20', group.preRun ? 'flex-row' : 'flex-col']}
		>
			{#each group.subGroups as subGroup (subGroup.id)}
				<DynamicFormSubGroup {subGroup} {group} {form} bind:collapsedSubGroups {errors} {onFieldChange} />
			{/each}
		</div>
	{/if}
</section>
