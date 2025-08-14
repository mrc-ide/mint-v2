export interface RunData {
	prevalenceData: Record<string, unknown[]>; // key of run and timeseries value
	casesData: Record<string, unknown[]>; // key of run and timeseries value
}
export interface Region {
	name: string;
	hasRun: boolean;
	formValues: Record<string, unknown>;
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
