import type { ScenarioTotals } from '$lib/process-results/processCases';
import type { EmulatorResults, Scenario } from './userState';

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

export type CompareSeriesName = 'Present' | 'Long term (baseline + control strategy)' | 'Long term (baseline only)';
export interface CompareResults {
	present: EmulatorResults;
	fullLongTerm: EmulatorResults;
	baselineLongTerm: EmulatorResults;
}
export interface CompareTotals {
	presentTotals: Partial<Record<Scenario, ScenarioTotals>>;
	baselineLongTermTotals: Partial<Record<Scenario, ScenarioTotals>>;
	fullLongTermTotals: Partial<Record<Scenario, ScenarioTotals>>;
}
