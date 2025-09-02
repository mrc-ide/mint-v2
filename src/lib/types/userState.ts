import type { FormValue } from '$lib/components/dynamic-region-form/types';

export interface PrevalenceData {
	scenario: string;
	days: number;
	prevalence: number;
}
export interface CasesData {
	scenario: string;
	year: number;
	cases: number;
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
