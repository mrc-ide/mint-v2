export interface CompareParameter {
	parameterName: string;
	label: string;
	min: number;
	max: number;
}

export interface InterventionCompareCost {
	costName: string;
	costLabel: string;
}
export interface InterventionCompareParameter extends CompareParameter {
	linkedCosts: InterventionCompareCost[];
}

export interface CompareParameters {
	baselineParameters: CompareParameter[];
	interventionParameters: InterventionCompareParameter[];
}
