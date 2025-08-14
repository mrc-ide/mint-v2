<script lang="ts">
	import debounce from 'debounce';
	import type { Snippet } from 'svelte';
	import { Button } from '../ui/button';
	import DynamicFormGroup from './DynamicFormGroup.svelte';
	import type { CustomValidationRule, Schema, SchemaField, SchemaGroup } from './types';
	import { coerceDefaults, forEachField, getFieldErrorMessage, getNumber } from './utils';

	type Props = {
		schema: Schema;
		initialValues: Record<string, unknown>;
		hasRun: boolean;
		children: Snippet;
		submit: (formValues: Record<string, unknown>, triggerRun?: boolean) => Promise<void>;
		submitText: string;
	};

	let { schema, initialValues, hasRun, children, submit, submitText }: Props = $props();
	const debouncedSubmit = debounce(submit, 500);
	// Initialize state from defaults + initialValues override
	let form = $state<Record<string, unknown>>({});
	let errors = $state<Record<string, string | null>>({});
	let collapsedGroups = $state<Record<string, boolean>>({});
	let collapsedSubGroups = $state<Record<string, boolean>>({});
	let hasFormErrors = $derived(Object.values(errors).some((error) => error !== null));
	// Helpers to iterate fields and to map field->group
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField(schema.groups, (field, group) => {
		fieldToGroup[field.id] = group;
	});
	// initialize form values and errors
	forEachField(schema.groups, (field, group, subGroup) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null;
		// initialize collapse states (default expanded)
		if (group.collapsible) {
			collapsedGroups[group.id] = Boolean(group.preRun) && hasRun;
		}
		const key = `${group.id}:${subGroup.id}`;
		if (subGroup.collapsible && collapsedSubGroups[key] === undefined) {
			collapsedSubGroups[key] = false;
		}
	});

	// Validation
	const validateField = (field: SchemaField) => {
		const val = form[field.id];
		const message = getFieldErrorMessage(field, val);
		errors[field.id] = message;
	};

	const validateCustomRules = () => {
		const rules: Record<string, CustomValidationRule> = schema.customValidationRules ?? {};
		for (const key of Object.keys(rules)) {
			const rule = rules[key];
			if (rule.type !== 'cross_field') continue;

			const sum = rule.fields.reduce((a: number, id: string) => a + getNumber(form[id]), 0);
			let violated = false;
			switch (rule.operator) {
				case 'sum_lte':
					violated = !(sum <= rule.threshold);
					break;
				case 'sum_lt':
					violated = !(sum < rule.threshold);
					break;
				case 'sum_gte':
					violated = !(sum >= rule.threshold);
					break;
				case 'sum_gt':
					violated = !(sum > rule.threshold);
					break;
				case 'sum_eq':
					violated = !(sum === rule.threshold);
					break;
			}
			for (const fid of rule.errorFields) {
				// attach or clear the custom error per involved field
				if (violated) errors[fid] = rule.message;
				else if (errors[fid] === rule.message) errors[fid] = null;
			}
		}
	};

	const onFieldChange = (field: SchemaField, value: unknown) => {
		form[field.id] = value;
		validateField(field);
		validateCustomRules();

		if (!hasRun || hasFormErrors) return;

		const group = fieldToGroup[field.id];
		debouncedSubmit(form, group.triggersRerun);
	};
	const collapsePreRunGroups = () => {
		for (const group of schema.groups) {
			if (group.collapsible && group.preRun) {
				collapsedGroups[group.id] = true;
			}
		}
	};
</script>

<form class="grid grid-cols-4 gap-4">
	{#each schema.groups as group}
		{#if group.preRun || hasRun}
			<DynamicFormGroup {group} {form} bind:collapsedGroups bind:collapsedSubGroups {errors} {onFieldChange} />
		{/if}
	{/each}

	{#if hasRun}
		<div class="col-span-3 col-start-2 row-span-2 row-start-2">
			{@render children()}
		</div>
	{/if}
	<div class="col-span-4 flex justify-center">
		{#if !hasRun}
			<Button
				onclick={() => {
					if (hasFormErrors) return;
					submit(form, true);
					collapsePreRunGroups();
				}}
				size="lg"
				disabled={hasFormErrors}
			>
				{submitText}
			</Button>
		{/if}
	</div>
</form>

<style></style>
