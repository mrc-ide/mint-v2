// TODO: these types are hardcoded.. will need to be generated once moved to r api
export type BaseField = {
	id: string;
	label: string;
	helpText?: string;
	required?: boolean;
	disabled?: boolean | CustomDisabled;
	value?: unknown | CustomValue;
	default?: unknown;
};

export type NumericField = BaseField & {
	type: 'number' | 'slider';
	max?: number;
	min?: number;
	step?: number;
	unit?: string;
	default?: number;
	integer?: boolean;
};

export type CheckboxField = BaseField & {
	type: 'checkbox';
	default?: boolean;
};

export type MultiselectField = BaseField & {
	type: 'multiselect';
	options: { label: string; value: string }[];
	default?: string[];
};

export type DisplayField = BaseField & {
	type: 'display';
	unit?: string;
	value: unknown | CustomValue;
};
export type SchemaField = NumericField | CheckboxField | MultiselectField | DisplayField;

export type CustomValidationRule = {
	type: 'cross_field'; // todo: make more generic when more show up
	fields: string[];
	errorFields: string[];
	operator: 'sum_lte' | 'sum_lt' | 'sum_gte' | 'sum_gt' | 'sum_eq';
	threshold: number;
	message: string;
};
export type CustomValue = {
	type: 'cross_field'; // todo: make more generic when more show up
	fields: string[];
	operator: 'sum' | 'avg' | 'min' | 'max';
};
export type CustomDisabled = {
	type: 'cross_field'; // todo: make more generic when more show up
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
	preRun?: boolean;
	subGroups: SchemaSubGroup[];
};

export type Schema = {
	groups: SchemaGroup[];
	customValidationRules?: Record<string, CustomValidationRule>;
};
