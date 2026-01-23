export interface CompareParameter {
	parameterName: string;
	label: string;
	min: number;
	max: number;
}
export interface CompareParameters {
	baselineParameters: CompareParameter[];
	interventionParameters: CompareParameter[];
}
