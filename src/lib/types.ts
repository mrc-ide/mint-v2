export interface Region {
	name: string;
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
