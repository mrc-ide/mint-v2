<script lang="ts">
	import debounce from 'debounce';
	import type { Snippet } from 'svelte';
	import { Button } from '../ui/button';
	import DynamicFormGroup from './DynamicFormGroup.svelte';
	import type { CustomValidationRule, DynamicFormSchema, SchemaField, SchemaGroup } from './types';
	import {
		checkCrossFieldValidation,
		coerceDefaults,
		forEachField,
		forEachGroup,
		forEachSubGroup,
		getFieldErrorMessage
	} from './utils';

	interface Props {
		schema: DynamicFormSchema;
		initialValues: Record<string, unknown>;
		// The first run is user-initiated after entering preRun values, subsequent runs are triggered automatically when fields change - this prop tracks these life cycle stages.
		hasRun: boolean;
		children: Snippet;
		submit: (formValues: Record<string, unknown>, triggerRun?: boolean) => Promise<void>;
		submitText: string;
	}

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
	forEachField(schema.groups, (field) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null;
	});
	forEachGroup(schema.groups, (group) => {
		// initialize collapse states (default expanded)
		if (group.collapsible) {
			collapsedGroups[group.id] = Boolean(group.preRun) && hasRun;
		}
	});
	forEachSubGroup(schema.groups, (group, subGroup) => {
		// initialize collapse states (default expanded)
		if (subGroup.collapsible && collapsedSubGroups[`${group.id}:${subGroup.id}`] === undefined) {
			collapsedSubGroups[`${group.id}:${subGroup.id}`] = false;
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
			// add checks for different types of validation rules
			checkCrossFieldValidation(form, rule, errors);
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
		forEachGroup(schema.groups, (group) => {
			if (group.collapsible && group.preRun) {
				collapsedGroups[group.id] = true;
			}
		});
	};
</script>

<form class="grid grid-cols-4 gap-4">
	{#each schema.groups as group (group.id)}
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
					submit(form, true).then(() => {
						collapsePreRunGroups();
					});
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
