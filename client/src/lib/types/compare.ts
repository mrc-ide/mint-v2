export interface CompareParameter {
	parameterName: string;
	label: string;
	min: number;
	max: number;
}

export interface CompareParameterWithValue extends CompareParameter {
	value: number;
}

export interface CompareParameters {
	baselineParameters: CompareParameter[];
	interventionParameters: CompareParameter[];
}
export interface CompareParametersWithValue {
	baselineParameters: CompareParameterWithValue[];
	interventionParameters: CompareParameterWithValue[];
}
