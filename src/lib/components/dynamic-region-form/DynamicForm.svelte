<script lang="ts">
	import debounce from 'debounce';
	import type { Snippet } from 'svelte';
	import { Button } from '../ui/button';
	import DynamicFormGroup from './DynamicFormGroup.svelte';
	import type { CustomValidationRule, DynamicFormSchema, FormValue, SchemaField, SchemaGroup } from './types';
	import {
		checkCrossFieldValidation,
		coerceDefaults,
		forEachField,
		forEachGroup,
		forEachSubGroup,
		getFieldErrorMessage
	} from './utils';
	import type { EmulatorResults } from '$lib/types/userState';

	interface Props {
		schema: DynamicFormSchema;
		initialValues: Record<string, FormValue>;
		hasRunBaseline: boolean;
		children: Snippet;
		run: (formValues: Record<string, unknown>) => Promise<EmulatorResults | null>;
		process: (formValues: Record<string, FormValue>) => void;
		submitText: string;
	}

	let { schema, initialValues, hasRunBaseline = $bindable(), children, run, process, submitText }: Props = $props();
	const debouncedRun = debounce(run, 500);
	const debouncedProcess = debounce(process, 500);
	// Initialize state from defaults + initialValues override
	let form = $state<Record<string, FormValue>>({});
	let errors = $state<Record<string, string | null>>({});
	let collapsedGroups = $state<Record<string, boolean>>({});
	let collapsedSubGroups = $state<Record<string, boolean>>({});
	let hasFormErrors = $derived(Object.values(errors).some((error) => error !== null));
	// Helpers to iterate fields and to map field->group
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField(schema.groups, (field, group) => {
		fieldToGroup[field.id] = group;
	});
	let triggerRunFormValues = $derived<Record<string, FormValue>>(
		Object.fromEntries(
			Object.entries(form).filter(([key, _value]) => {
				const group = fieldToGroup[key];
				return group && group.triggersRerun;
			})
		)
	);
	// initialize form values and errors
	forEachField(schema.groups, (field) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null;
	});
	forEachGroup(schema.groups, (group) => {
		// initialize collapse states (default expanded)
		if (group.collapsible) {
			collapsedGroups[group.id] = Boolean(group.preRun) && hasRunBaseline;
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

	const onFieldChange = (field: SchemaField, value: FormValue) => {
		form[field.id] = value;
		validateField(field);
		validateCustomRules();

		if (!hasRunBaseline || hasFormErrors) return;

		const group = fieldToGroup[field.id];
		if (group.triggersRerun) {
			debouncedRun(triggerRunFormValues);
		} else {
			debouncedProcess(form);
		}
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
		{#if group.preRun || hasRunBaseline}
			<DynamicFormGroup {group} {form} bind:collapsedGroups bind:collapsedSubGroups {errors} {onFieldChange} />
		{/if}
	{/each}

	{#if hasRunBaseline}
		<div class="col-span-3 col-start-2 row-span-2 row-start-2">
			{@render children()}
		</div>
	{/if}
	<div class="col-span-4 flex justify-center">
		{#if !hasRunBaseline}
			<Button
				onclick={async () => {
					if (hasFormErrors) return;
					hasRunBaseline = true;
					try {
						await run(triggerRunFormValues);
						collapsePreRunGroups();
					} catch (error) {
						hasRunBaseline = false;
					}
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
