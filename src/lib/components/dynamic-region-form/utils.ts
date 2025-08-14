import type { CustomDisabled, CustomValue, SchemaField, SchemaGroup, SchemaSubGroup } from './types';

export const forEachField = (
	groups: SchemaGroup[],
	callback: (f: SchemaField, g: SchemaGroup, sg: SchemaSubGroup) => void
) => {
	for (const group of groups) {
		for (const subGroup of group.subGroups) {
			for (const f of subGroup.fields) callback(f, group, subGroup);
		}
	}
};

export const coerceDefaults = (field: SchemaField): unknown => {
	// For display fields, we won't assign default here (computed later)
	switch (field.type) {
		case 'checkbox':
			return field.default ?? false;
		case 'number':
		case 'slider':
			return field.default ?? 0;
		case 'multiselect':
			return field.default ?? [];
		default:
			return field.default ?? null; // For 'display' or any other type, return default or null
	}
};

export const getNumber = (val: unknown): number => {
	const n = typeof val === 'number' ? val : Number(val);
	return Number.isFinite(n) ? n : 0;
};

export const evaluateValueExpression = (form: Record<string, unknown>, field: SchemaField): unknown => {
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
			return null;
	}
};

export const isDisabled = (form: Record<string, unknown>, field: SchemaField): boolean => {
	if (typeof field.disabled === 'boolean') return field.disabled;
	if (!field.disabled || typeof field.disabled !== 'object') return false;
	const expr: CustomDisabled = field.disabled;
	const vals = expr.fields.map((id) => form[id]);
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

export const isGroupCollapsed = (collapsedGroups: Record<string, boolean>, group: SchemaGroup) =>
	!!collapsedGroups[group.id];

export const isSubGroupCollapsed = (collapsedSubGroups: Record<string, boolean>, groupId: string, subGroupId: string) =>
	!!collapsedSubGroups[`${groupId}:${subGroupId}`];

export const getFieldErrorMessage = (field: SchemaField, value: unknown): string | null => {
	let message: string | null = null;

	// Required field validation
	if (field.required && (value === null || value === undefined || value === '' || Number.isNaN(value))) {
		message = `${field.label} is required`;
	}

	// Numeric field validation
	if (!message && (field.type === 'number' || field.type === 'slider')) {
		const numValue = getNumber(value);

		// Min value check
		if (typeof field.min === 'number' && numValue < field.min) {
			message = `${field.label} must be ≥ ${field.min}`;
		}

		// Max value check
		if (!message && typeof field.max === 'number' && numValue > field.max) {
			message = `${field.label} must be ≤ ${field.max}`;
		}

		// Integer check
		if (!message && field.integer && !Number.isInteger(numValue)) {
			message = `${field.label} must be an integer`;
		}
	}
	return message;
};
