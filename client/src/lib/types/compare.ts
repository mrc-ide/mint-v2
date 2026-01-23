export interface CompareParameter {
	parameterName: string;
	label: string;
	min: 0;
	max: number;
}
export interface CompareParameters {
	baselineParameters: CompareParameter[];
	interventionParameters: CompareParameter[];
}
