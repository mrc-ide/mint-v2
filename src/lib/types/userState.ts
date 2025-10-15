import type { FormValue } from '$lib/components/dynamic-region-form/types';
import type { strategiseSchema } from '$routes/projects/[project]/strategise/schema';
import { z } from 'zod';
export type Scenario =
	| 'no_intervention'
	| 'irs_only'
	| 'lsm_only'
	| 'py_only_only'
	| 'py_only_with_lsm'
	| 'py_pbo_only'
	| 'py_pbo_with_lsm'
	| 'py_pyrrole_only'
	| 'py_pyrrole_with_lsm'
	| 'py_ppf_only'
	| 'py_ppf_with_lsm';
export interface PrevalenceData {
	scenario: Scenario;
	days: number;
	prevalence: number;
}
export const PRE_INTERVENTION_YEAR = 1 as const;
export const POST_INTERVENTION_YEARS = [2, 3, 4] as const;
export interface CasesData {
	scenario: Scenario;
	year: typeof PRE_INTERVENTION_YEAR | (typeof POST_INTERVENTION_YEARS)[number]; // 1=baseline, 2-4=years post-intervention
	casesPer1000: number;
}
export interface EmulatorResults {
	prevalence: PrevalenceData[];
	cases: CasesData[];
}

export interface Region {
	name: string;
	hasRunBaseline: boolean;
	formValues: Record<string, FormValue>;
	cases: CasesData[];
}
export interface StrategiseIntervention {
	region: string;
	intervention: Scenario;
	cost: number;
	casesAverted: number;
}

export type StrategiseResults = z.infer<typeof strategiseSchema>['strategiseResults'];

export interface Strategy {
	budget: number;
	results: StrategiseResults;
}
export interface Project {
	name: string;
	regions: Region[];
	strategy?: Strategy;
}

export interface UserState {
	userId: string;
	createdAt: string;
	projects: Project[];
}
