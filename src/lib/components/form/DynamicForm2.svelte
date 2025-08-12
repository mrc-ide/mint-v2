<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';
	import * as Collapsible from '$lib/components/ui/collapsible/';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	type SchemaField = {
		id: string;
		label: string;
		helpText?: string;
		type: 'number' | 'checkbox' | 'slider' | 'multiselect' | 'display';
		required?: boolean;
		default?: unknown;
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		options?: { label: string; value: string }[];
		validation?: {
			rules?: string[]; // e.g. ['integer']
			message?: string;
			custom?: string[]; // references to top-level customValidationRules
		};
		disabled?: boolean | CustomDisabled;
		value?: unknown | CustomValue;
	};
	type CustomValue = {
		type: 'cross_field';
		fields: string[];
		operator: 'sum' | 'avg' | 'min' | 'max';
	};
	type CustomDisabled = {
		type: 'cross_field';
		fields: string[];
		operator: 'falsy' | 'all' | 'any';
		threshold?: number;
	};

	type SchemaSubGroup = {
		id: string;
		title: string;
		description?: string;
		helpText?: string;
		collapsible?: boolean;
		fields: SchemaField[];
	};

	type SchemaGroup = {
		id: string;
		title: string;
		description?: string;
		helpText?: string;
		collapsible?: boolean;
		triggersRerun?: boolean;
		subGroups: SchemaSubGroup[];
	};

	type CustomRule = {
		type: 'cross_field';
		fields: string[];
		operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
		threshold: number;
		message: string;
	};

	type Custom = {
		type: 'cross_field';
		fields: string[];
		operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
	};

	type Schema = {
		groups: SchemaGroup[];
		customValidationRules?: Record<string, CustomRule>;
	};

	let {
		schema,
		initialValues = {},
		className = ''
	}: { schema: Schema; initialValues?: Record<string, unknown>; className?: string } = $props<{
		schema: Schema;
		initialValues: Record<string, unknown>;
		className: string;
	}>();

	// helpers to iterate fields and map field-> group
	const forEachField = (callback: (field: SchemaField, group: SchemaGroup, subGroup: SchemaSubGroup) => void) => {
		schema.groups.forEach((group) => {
			group.subGroups.forEach((subGroup) => {
				subGroup.fields.forEach((field) => {
					callback(field, group, subGroup);
				});
			});
		});
	};
	const fieldToGroup: Record<string, SchemaGroup> = {};
	forEachField((field, group, _) => {
		fieldToGroup[field.id] = group;
	});

	// Initialize state from defaults + initialValues override
	const form = $state<Record<string, unknown>>({});
	const errors = $state<Record<string, string | null>>({});
	const collapsedGroups = $state<Record<string, boolean>>({});
	const collapsedSubGroups = $state<Record<string, boolean>>({});

	const coerceDefaults = (field: SchemaField): unknown => {
		// For display fields, we won't assign default here (computed later)
		switch (field.type) {
			case 'checkbox':
				return typeof field.default === 'boolean' ? field.default : false;
			case 'number':
			case 'slider':
				return typeof field.default === 'number' ? field.default : 0;
			case 'multiselect':
				return Array.isArray(field.default) ? field.default : [];
			default:
				return field.default ?? null; // For 'display' or any other type, return default or null
		}
	};

	// init
	forEachField((field, group, subGroup) => {
		form[field.id] = initialValues[field.id] ?? coerceDefaults(field);
		errors[field.id] = null; // Initialize errors to null
		if (group.collapsible) {
			collapsedGroups[group.id] = false;
		}
		if (subGroup.collapsible) {
			collapsedSubGroups[subGroup.id] = false;
		}
	});

	// todo: can we just combine group and sub group logic?
	const isGroupCollapsed = (group: SchemaGroup): boolean => {
		return collapsedGroups[group.id] ?? false;
	};
	const isSubGroupCollapsed = (subGroup: SchemaSubGroup): boolean => {
		return collapsedSubGroups[subGroup.id] ?? false;
	};
	// Util: evaluate display and disabled expressions
	const getNumber = (val: unknown): number => {
		const num = typeof val === 'number' ? val : Number(val);
		return Number.isFinite(num) ? num : 0;
	};

	const evalValueExpression = (field: SchemaField): unknown => {
		if (field.type !== 'display' || !field.value || typeof field.value !== 'object') return form[field.id];
		const expr = field.value as CustomValue;
		const vals = expr.fields.map((id) => getNumber(form[id]));

		switch (expr.operator) {
			case 'sum':
				return vals.reduce((a, b) => a + b, 0);
			case 'avg':
				return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
			case 'min':
				return vals.length ? Math.min(...vals) : 0;
			case 'max':
				return vals.length ? Math.max(...vals) : 0;
			default:
				return null; // Fallback for unsupported operators
		}
	};

	const isDisabled = (field: SchemaField): boolean => {
		if (typeof field.disabled === 'boolean') return field.disabled;
		if (!field.disabled || typeof field.disabled !== 'object') return false;
		const expr = field.disabled as CustomDisabled;
		const vals = expr.fields?.map((id) => form[id]);
		switch (expr.operator) {
			case 'falsy':
				return vals.every((val) => !val) ?? false;
			case 'all':
				return vals.every((val) => Boolean(val)) ?? false;
			case 'any':
				return vals.some((val) => Boolean(val)) ?? false;
			default:
				return false;
		}
	};

	// Validation
	const validateField = (field: SchemaField) => {
		let errorMessage: string | null = null;
		const value = form[field.id];

		if (field.required && !value) {
			errorMessage = `${field.label} is required`;
			errors[field.id] = errorMessage;
			return;
		}
		if (field.type === 'number' || field.type === 'slider') {
			const numValue = getNumber(value);
			if (typeof field.min === 'number' && numValue < field.min) {
				errorMessage = `${field.label} must be at least ${field.min}`;
				errors[field.id] = errorMessage;
				return;
			}
			if (typeof field.max === 'number' && numValue > field.max) {
				errorMessage = `${field.label} must be at most ${field.max}`;
				errors[field.id] = errorMessage;
				return;
			}
		}
		if (field.validation?.rules?.includes('integer')) {
			const numValue = getNumber(value);
			if (!Number.isInteger(numValue)) {
				errorMessage = `${field.label} must be an integer`;
				errors[field.id] = errorMessage;
				return;
			}
		}
	};

	const validateCustomRules = () => {
		const rules = schema.customValidationRules;
		for (const [key, rule] of Object.entries(rules || {})) {
			if (rule.type !== 'cross_field') continue;
			const sum = rule.fields.reduce((acc, id) => acc + getNumber(form[id]), 0);
			let violated = false;
			switch (rule.operator) {
				case 'sum_lte':
					violated = sum > rule.threshold;
					break;
				case 'sum_gte':
					violated = sum < rule.threshold;
					break;
				case 'sum_gt':
					violated = sum <= rule.threshold;
					break;
				case 'sum_eq':
					violated = sum !== rule.threshold;
					break;
				case 'sum_lt':
					violated = sum >= rule.threshold;
					break;
			}
			for (const fieldId in rule.fields) {
				if (violated) errors[fieldId] = rule.message;
				else if (errors[fieldId] === rule.message) errors[fieldId] = null;
			}
		}
	};
	// Debounced rerun on changes within triggersRerun groups
	let rerunTimer: ReturnType<typeof setTimeout> | null = null;
	const rerunModel = (waitMs: number = 500) => {
		if (rerunTimer) clearTimeout(rerunTimer);
		rerunTimer = setTimeout(() => {
			// Re-run page data loading (e.g. refetch timeseries)
			invalidateAll();
		}, waitMs);
	};

	const onChange = (field: SchemaField, value: unknown) => {
		form[field.id] = value;
		validateField(field);
		validateCustomRules();

		// rerun if this group triggers reruns and there are no validation errors
		const group = fieldToGroup[field.id];
		const hasErrors = Object.values(errors).some((error) => error !== null);
		if (group.triggersRerun && !hasErrors) {
			rerunModel();
		}
	};

	// keep display fields in sync? probs can bind to fix? or may not need this
	$effect(() => {
		forEachField((field) => {
			if (field.type === 'display') {
				form[field.id] = evalValueExpression(field);
			}
		});
	});

	$inspect(form);
</script>

<form class={cn('space-y-6', className)}>
	{#each schema.groups as group}{/each}
</form>
