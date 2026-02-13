export interface CompareParameter {
	parameterName: string;
	label: string;
	min: number;
	max: number;
}
export interface InterventionCompareParameter extends CompareParameter {
	linkedCostName: string;
	linkedCostLabel: string;
}

export interface CompareParameters {
	baselineParameters: CompareParameter[];
	interventionParameters: InterventionCompareParameter[];
}
