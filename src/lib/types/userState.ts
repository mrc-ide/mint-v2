import type { FormValue } from '$lib/components/dynamic-region-form/types';

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
export interface CasesData {
	scenario: Scenario;
	year: number;
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
}
export interface Project {
	name: string;
	budget: number;
	regions: Region[];
	canStrategize?: boolean;
}

export interface UserState {
	userId: string;
	createdAt: string;
	projects: Project[];
}
