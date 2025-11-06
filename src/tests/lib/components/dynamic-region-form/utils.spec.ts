import type {
	CrossFieldValidationRule,
	CustomDisabled,
	CustomValue,
	SchemaField,
	SchemaGroup
} from '$lib/components/dynamic-region-form/types';
import {
	checkCrossFieldValidation,
	coerceDefaults,
	evaluateValueExpression,
	forEachField,
	forEachGroup,
	forEachSubGroup,
	getFieldErrorMessage,
	getNumber,
	isCustomCrossFieldRuleViolated,
	isDisabled,
	isGroupCollapsed,
	isSubGroupCollapsed
} from '$lib/components/dynamic-region-form/utils';

describe('forEachGroup', () => {
	it('should call callback for each group', () => {
		const groups: SchemaGroup[] = [
			{ id: 'g1', title: 'Group 1', subGroups: [] },
			{ id: 'g2', title: 'Group 2', subGroups: [] }
		] as any;
		const ids: string[] = [];
		forEachGroup(groups, (g) => ids.push(g.id));
		expect(ids).toEqual(['g1', 'g2']);
	});

	it('should handle empty groups array', () => {
		const callback = vi.fn();
		forEachGroup([], callback);
		expect(callback).not.toHaveBeenCalled();
	});
});

describe('forEachSubGroup', () => {
	it('should call callback for each subgroup with parent group', () => {
		const groups: SchemaGroup[] = [
			{
				id: 'g1',
				label: 'Group 1',
				subGroups: [
					{ id: 'sg1', title: 'SubGroup 1', fields: [] },
					{ id: 'sg2', title: 'SubGroup 2', fields: [] }
				]
			}
		] as any;
		const results: Array<{ groupId: string; subGroupId: string }> = [];
		forEachSubGroup(groups, (g, sg) => results.push({ groupId: g.id, subGroupId: sg.id }));
		expect(results).toEqual([
			{ groupId: 'g1', subGroupId: 'sg1' },
			{ groupId: 'g1', subGroupId: 'sg2' }
		]);
	});

	it('should handle groups with no subgroups', () => {
		const groups: SchemaGroup[] = [{ id: 'g1', title: 'Group 1', subGroups: [] }] as any;
		const callback = vi.fn();
		forEachSubGroup(groups, callback);
		expect(callback).not.toHaveBeenCalled();
	});
});

describe('forEachField', () => {
	it('should call callback for each field with parent group and subgroup', () => {
		const groups: SchemaGroup[] = [
			{
				id: 'g1',
				label: 'Group 1',
				subGroups: [
					{
						id: 'sg1',
						title: 'SubGroup 1',
						fields: [
							{ id: 'f1', type: 'number', label: 'Field 1' },
							{ id: 'f2', type: 'toggle', label: 'Field 2' }
						]
					}
				]
			}
		] as any;
		const results: Array<{ fieldId: string; groupId: string; subGroupId: string }> = [];
		forEachField(groups, (f, g, sg) => results.push({ fieldId: f.id, groupId: g.id, subGroupId: sg.id }));
		expect(results).toEqual([
			{ fieldId: 'f1', groupId: 'g1', subGroupId: 'sg1' },
			{ fieldId: 'f2', groupId: 'g1', subGroupId: 'sg1' }
		]);
	});

	it('should handle empty fields', () => {
		const groups: SchemaGroup[] = [
			{
				id: 'g1',
				title: 'Group 1',
				subGroups: [{ id: 'sg1', title: 'SubGroup 1', fields: [] }]
			}
		] as any;
		const callback = vi.fn();
		forEachField(groups, callback);
		expect(callback).not.toHaveBeenCalled();
	});
});

describe('coerceDefaults', () => {
	it('should return false for toggle without default', () => {
		const field: SchemaField = { id: 'f1', type: 'toggle', label: 'Toggle' };
		expect(coerceDefaults(field)).toBe(false);
	});

	it('should return provided default for toggle', () => {
		const field: SchemaField = { id: 'f1', type: 'toggle', label: 'Toggle', default: true };
		expect(coerceDefaults(field)).toBe(true);
	});

	it('should return 0 for number without default', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number' };
		expect(coerceDefaults(field)).toBe(0);
	});

	it('should return provided default for number', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number', default: 42 };
		expect(coerceDefaults(field)).toBe(42);
	});

	it('should return 0 for slider without default', () => {
		const field: SchemaField = { id: 'f1', type: 'slider', label: 'Slider', min: 0, max: 100 };
		expect(coerceDefaults(field)).toBe(0);
	});

	it('should return empty array for multiselect without default', () => {
		const field: SchemaField = { id: 'f1', type: 'multiselect', label: 'Multi', options: [] };
		expect(coerceDefaults(field)).toEqual([]);
	});

	it('should return provided default for multiselect', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'multiselect',
			label: 'Multi',
			options: [],
			default: ['a', 'b']
		};
		expect(coerceDefaults(field)).toEqual(['a', 'b']);
	});

	it('should return null for display field', () => {
		const field: SchemaField = { id: 'f1', type: 'display', label: 'Display' } as any;
		expect(coerceDefaults(field)).toBeNull();
	});
});

describe('getNumber', () => {
	it('should return number as-is', () => {
		expect(getNumber(42)).toBe(42);
		expect(getNumber(0)).toBe(0);
		expect(getNumber(-10)).toBe(-10);
	});

	it('should convert string to number', () => {
		expect(getNumber('42')).toBe(42);
		expect(getNumber('0')).toBe(0);
		expect(getNumber('-10')).toBe(-10);
	});

	it('should return 0 for non-numeric values', () => {
		expect(getNumber('abc')).toBe(0);
		expect(getNumber(NaN)).toBe(0);
		expect(getNumber(undefined)).toBe(0);
		expect(getNumber(null)).toBe(0);
		expect(getNumber(Infinity)).toBe(0);
	});
});

describe('evaluateValueExpression', () => {
	it('should return form value for non-display fields', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number' };
		const form = { f1: 42 };
		expect(evaluateValueExpression(form, field)).toBe(42);
	});

	it('should return form value for display field without custom value', () => {
		const field: SchemaField = { id: 'f1', type: 'display', label: 'Display' } as any;
		const form = { f1: 100 };
		expect(evaluateValueExpression(form, field)).toBe(100);
	});

	it('should calculate sum for display field', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Total',
			value: { operator: 'sum', fields: ['a', 'b', 'c'] } as CustomValue
		};
		const form = { a: 10, b: 20, c: 30 };
		expect(evaluateValueExpression(form, field)).toBe(60);
	});

	it('should calculate average for display field', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Average',
			value: { operator: 'avg', fields: ['a', 'b', 'c'] } as CustomValue
		};
		const form = { a: 10, b: 20, c: 30 };
		expect(evaluateValueExpression(form, field)).toBe(20);
	});

	it('should return 0 for average with no fields', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Average',
			value: { operator: 'avg', fields: [] } as unknown as CustomValue
		};
		const form = {};
		expect(evaluateValueExpression(form, field)).toBe(0);
	});

	it('should calculate minimum for display field', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Min',
			value: { operator: 'min', fields: ['a', 'b', 'c'] } as CustomValue
		};
		const form = { a: 30, b: 10, c: 20 };
		expect(evaluateValueExpression(form, field)).toBe(10);
	});

	it('should calculate maximum for display field', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Max',
			value: { operator: 'max', fields: ['a', 'b', 'c'] } as CustomValue
		};
		const form = { a: 30, b: 10, c: 20 };
		expect(evaluateValueExpression(form, field)).toBe(30);
	});

	it('should return 0 for min/max with no fields', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Max',
			value: { operator: 'max', fields: [] } as unknown as CustomValue
		};
		expect(evaluateValueExpression({}, field)).toBe(0);
	});

	it('should return null for unknown operator', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'display',
			label: 'Unknown',
			value: { operator: 'unknown' as any, fields: ['a'] } as any
		};
		expect(evaluateValueExpression({ a: 10 }, field)).toBeNull();
	});
});

describe('isDisabled', () => {
	it('should return boolean disabled value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number', disabled: true };
		expect(isDisabled({}, field)).toBe(true);
	});

	it('should return false when disabled is false', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number', disabled: false };
		expect(isDisabled({}, field)).toBe(false);
	});

	it('should return false when disabled is not set', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Number' };
		expect(isDisabled({}, field)).toBe(false);
	});

	it('should return true when all fields are falsy (falsy operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'falsy', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 0, b: false }, field)).toBe(true);
	});

	it('should return false when any field is truthy (falsy operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'falsy', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 0, b: true }, field)).toBe(false);
	});

	it('should return true when all fields are truthy (all operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'all', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 1, b: true }, field)).toBe(true);
	});

	it('should return false when any field is falsy (all operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'all', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 1, b: false }, field)).toBe(false);
	});

	it('should return true when any field is truthy (any operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'any', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 0, b: true }, field)).toBe(true);
	});

	it('should return false when all fields are falsy (any operator)', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'any', fields: ['a', 'b'] } as CustomDisabled
		};
		expect(isDisabled({ a: 0, b: false }, field)).toBe(false);
	});

	it('should return false for unknown operator', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Number',
			disabled: { operator: 'unknown' as any, fields: ['a'] } as CustomDisabled
		};
		expect(isDisabled({ a: true }, field)).toBe(false);
	});
});

describe('isGroupCollapsed', () => {
	it('should return true when group is collapsed', () => {
		const group: SchemaGroup = { id: 'g1', title: 'Group 1', subGroups: [] } as any;
		expect(isGroupCollapsed({ g1: true }, group)).toBe(true);
	});

	it('should return false when group is not collapsed', () => {
		const group: SchemaGroup = { id: 'g1', title: 'Group 1', subGroups: [] } as any;
		expect(isGroupCollapsed({ g1: false }, group)).toBe(false);
	});

	it('should return false when group is not in collapsed state', () => {
		const group: SchemaGroup = { id: 'g1', title: 'Group 1', subGroups: [] } as any;
		expect(isGroupCollapsed({}, group)).toBe(false);
	});
});

describe('isSubGroupCollapsed', () => {
	it('should return true when subgroup is collapsed', () => {
		expect(isSubGroupCollapsed({ 'g1:sg1': true }, 'g1', 'sg1')).toBe(true);
	});

	it('should return false when subgroup is not collapsed', () => {
		expect(isSubGroupCollapsed({ 'g1:sg1': false }, 'g1', 'sg1')).toBe(false);
	});

	it('should return false when subgroup is not in collapsed state', () => {
		expect(isSubGroupCollapsed({}, 'g1', 'sg1')).toBe(false);
	});
});

describe('getFieldErrorMessage', () => {
	it('should return error for required field with null value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', required: true };
		expect(getFieldErrorMessage(field, null)).toBe('Amount is required');
	});

	it('should return error for required field with undefined value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', required: true };
		expect(getFieldErrorMessage(field, undefined)).toBe('Amount is required');
	});

	it('should return error for required field with empty string', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', required: true };
		expect(getFieldErrorMessage(field, '')).toBe('Amount is required');
	});

	it('should return error for required field with NaN', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', required: true };
		expect(getFieldErrorMessage(field, NaN)).toBe('Amount is required');
	});

	it('should return null for required field with valid value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', required: true };
		expect(getFieldErrorMessage(field, 42)).toBeNull();
	});

	it('should return error when number is below minimum', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', min: 10 };
		expect(getFieldErrorMessage(field, 5)).toBe('Amount must be ≥ 10');
	});

	it('should return null when number meets minimum', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', min: 10 };
		expect(getFieldErrorMessage(field, 10)).toBeNull();
	});

	it('should return error when number exceeds maximum', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', max: 100 };
		expect(getFieldErrorMessage(field, 150)).toBe('Amount must be ≤ 100');
	});

	it('should return null when number meets maximum', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Amount', max: 100 };
		expect(getFieldErrorMessage(field, 100)).toBeNull();
	});

	it('should return error when integer field has decimal value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Count', integer: true };
		expect(getFieldErrorMessage(field, 42.5)).toBe('Count must be an integer');
	});

	it('should return null when integer field has integer value', () => {
		const field: SchemaField = { id: 'f1', type: 'number', label: 'Count', integer: true };
		expect(getFieldErrorMessage(field, 42)).toBeNull();
	});

	it('should validate slider fields like number fields', () => {
		const field: SchemaField = { id: 'f1', type: 'slider', label: 'Level', min: 0, max: 10 };
		expect(getFieldErrorMessage(field, -1)).toBe('Level must be ≥ 0');
		expect(getFieldErrorMessage(field, 11)).toBe('Level must be ≤ 10');
	});

	it('should return null for non-numeric field types', () => {
		const field: SchemaField = { id: 'f1', type: 'toggle', label: 'Enabled' };
		expect(getFieldErrorMessage(field, false)).toBeNull();
	});

	it('should prioritize required error over numeric errors', () => {
		const field: SchemaField = {
			id: 'f1',
			type: 'number',
			label: 'Amount',
			required: true,
			min: 10
		};
		expect(getFieldErrorMessage(field, null)).toBe('Amount is required');
	});
});

describe('isCustomCrossFieldRuleViolated', () => {
	it('should detect sum_lte violation when sum exceeds threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be <= 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 50 }, rule)).toBe(true);
	});

	it('should pass sum_lte when sum equals threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be <= 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(false);
	});

	it('should detect sum_lt violation when sum equals or exceeds threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lt',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be < 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(true);
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 50 }, rule)).toBe(true);
	});

	it('should detect sum_gte violation when sum is below threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_gte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be >= 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 30, b: 40 }, rule)).toBe(true);
	});

	it('should pass sum_gte when sum equals threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_gte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be >= 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(false);
	});

	it('should detect sum_gt violation when sum is below or equals threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_gt',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must be > 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(true);
		expect(isCustomCrossFieldRuleViolated({ a: 30, b: 40 }, rule)).toBe(true);
	});

	it('should detect sum_eq violation when sum does not equal threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_eq',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must equal 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 50 }, rule)).toBe(true);
	});

	it('should pass sum_eq when sum equals threshold', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_eq',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Sum must equal 100',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(false);
	});

	it('should return false for unknown operator', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'unknown' as any,
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Invalid',
			errorFields: ['a', 'b']
		};
		expect(isCustomCrossFieldRuleViolated({ a: 60, b: 40 }, rule)).toBe(false);
	});
});

describe('checkCrossFieldValidation', () => {
	it('should set errors on errorFields when rule is violated', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Total cannot exceed 100',
			errorFields: ['a', 'b']
		};
		const errors: Record<string, string | null> = {};
		checkCrossFieldValidation({ a: 60, b: 50 }, rule, errors);
		expect(errors.a).toBe('Total cannot exceed 100');
		expect(errors.b).toBe('Total cannot exceed 100');
	});

	it('should clear errors when rule is no longer violated', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Total cannot exceed 100',
			errorFields: ['a', 'b']
		};
		const errors: Record<string, string | null> = {
			a: 'Total cannot exceed 100',
			b: 'Total cannot exceed 100'
		};
		checkCrossFieldValidation({ a: 40, b: 50 }, rule, errors);
		expect(errors.a).toBeNull();
		expect(errors.b).toBeNull();
	});

	it('should not clear errors with different messages', () => {
		const rule: CrossFieldValidationRule = {
			type: 'cross_field',
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Total cannot exceed 100',
			errorFields: ['a', 'b']
		};
		const errors: Record<string, string | null> = {
			a: 'Different error message',
			b: 'Total cannot exceed 100'
		};
		checkCrossFieldValidation({ a: 40, b: 50 }, rule, errors);
		expect(errors.a).toBe('Different error message');
		expect(errors.b).toBeNull();
	});

	it('should do nothing for non-cross_field rule type', () => {
		const rule = {
			type: 'other_type' as any,
			operator: 'sum_lte',
			fields: ['a', 'b'],
			threshold: 100,
			message: 'Total cannot exceed 100',
			errorFields: ['a', 'b']
		} as CrossFieldValidationRule;
		const errors: Record<string, string | null> = {};
		checkCrossFieldValidation({ a: 60, b: 50 }, rule, errors);
		expect(errors.a).toBeUndefined();
		expect(errors.b).toBeUndefined();
	});
});
