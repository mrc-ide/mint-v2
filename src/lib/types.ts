export interface Region {
	name: string;
}
export interface Project {
	name: string;
	budget: number;
	regions: Region[];
}

export interface UserState {
	userId: string;
	createdAt: string;
	projects: Project[];
}
