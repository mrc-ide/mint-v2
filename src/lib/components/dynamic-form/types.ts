export type SchemaField = {
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
	integer?: boolean;
	options?: { label: string; value: string }[];
	disabled?: boolean | CustomDisabled;
	value?: unknown | CustomValue;
};

export type NumericField = SchemaField & {
	type: 'number' | 'slider';
	max?: number;
	min?: number;
	step?: number;
	unit?: string;
	default?: number;
};

export type CheckboxField = SchemaField & {
	type: 'checkbox';
	default?: boolean;
};

export type MultiselectField = SchemaField & {
	type: 'multiselect';
	options: { label: string; value: string }[];
	default?: string[];
};

export type DisplayField = SchemaField & {
	type: 'display';
	unit?: string;
	value: unknown | CustomValue;
};

export type CustomValidationRule = {
	type: 'cross_field';
	fields: string[];
	errorFields: string[];
	operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
	threshold: number;
	message: string;
};
export type CustomValue = {
	type: 'cross_field';
	fields: string[];
	operator: 'sum' | 'avg' | 'min' | 'max';
};
export type CustomDisabled = {
	type: 'cross_field';
	fields: string[];
	operator: 'falsy' | 'all' | 'any';
	threshold?: number;
};

export type SchemaSubGroup = {
	id: string;
	title: string;
	description: string;
	helpText?: string;
	collapsible?: boolean;
	fields: SchemaField[];
};

export type SchemaGroup = {
	id: string;
	title: string;
	description: string;
	helpText?: string;
	collapsible?: boolean;
	triggersRerun?: boolean;
	subGroups: SchemaSubGroup[];
};

export type Schema = {
	groups: SchemaGroup[];
	customValidationRules?: Record<string, CustomValidationRule>;
};
