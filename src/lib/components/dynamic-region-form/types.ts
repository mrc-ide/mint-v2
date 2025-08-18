export interface BaseField {
	id: string;
	label: string;
	helpText?: string;
	required?: boolean;
	disabled?: boolean | CustomDisabled;
	value?: unknown | CustomValue;
	default?: unknown;
}

export interface NumericField extends BaseField {
	type: 'number' | 'slider';
	max?: number;
	min?: number;
	step?: number;
	unit?: string;
	default?: number;
	integer?: boolean;
}

export interface ToggleField extends BaseField {
	type: 'toggle';
	default?: boolean;
}

export interface MultiselectField extends BaseField {
	type: 'multiselect';
	options: { label: string; value: string }[];
	default?: string[];
}

export interface DisplayField extends BaseField {
	type: 'display';
	unit?: string;
	value: unknown | CustomValue;
}

export type SchemaField = NumericField | ToggleField | MultiselectField | DisplayField;

export interface CrossFieldValidationRule {
	type: 'cross_field';
	fields: string[];
	errorFields: string[];
	operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
	threshold: number;
	message: string;
}
export type CustomValidationRule = CrossFieldValidationRule; // union as more types are added

export interface CrossFieldValue {
	type: 'cross_field';
	fields: string[];
	operator: 'sum' | 'avg' | 'min' | 'max';
}
export type CustomValue = CrossFieldValue; // union as more types are added

export interface CrossFieldDisabled {
	type: 'cross_field';
	fields: string[];
	operator: 'falsy' | 'all' | 'any';
	threshold?: number;
}
export type CustomDisabled = CrossFieldDisabled; // union as more types are added

export interface SchemaSubGroup {
	id: string;
	title: string;
	description: string;
	helpText?: string;
	collapsible?: boolean;
	fields: SchemaField[];
}

export interface SchemaGroup {
	id: string;
	title: string;
	description: string;
	helpText?: string;
	collapsible?: boolean;
	triggersRerun?: boolean;
	preRun?: boolean;
	subGroups: SchemaSubGroup[];
}

export interface DynamicFormSchema {
	groups: SchemaGroup[];
	customValidationRules?: Record<string, CustomValidationRule>;
}
