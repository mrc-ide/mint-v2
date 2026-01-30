import type { DynamicFormSchema, FormValue } from '$lib/components/dynamic-region-form/types';
import { ApiError, apiFetch } from '$lib/fetch';
import { saveUserState } from '$lib/server/redis';
import type { EmulatorResults, Region, UserState } from '$lib/types/userState';
import { regionFormUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/projects/[project]/regions/[region]/$types';

export const getRegionFormSchema = async (
	projectName: string,
	regionName: string,
	fetch: RequestEvent['fetch']
): Promise<DynamicFormSchema> => {
	try {
		const res = await apiFetch<DynamicFormSchema>({ url: regionFormUrl(), fetcher: fetch });
		return res.data;
	} catch (e) {
		const errorStatus = e instanceof ApiError ? e.status : 500;
		error(errorStatus, `Failed to fetch form schema for region "${regionName}" in project "${projectName}"`);
	}
};

export const saveRegionRun = async (
	userState: UserState,
	project: string,
	region: string,
	formValues: Record<string, FormValue>,
	results: EmulatorResults
) => {
	const regionData = getRegionFromUserState(userState, project, region);
	regionData.formValues = formValues;
	regionData.results = results;
	regionData.hasRunBaseline = true;
	await saveUserState(userState);
};

export const saveRegionFormState = async (
	userState: UserState,
	projectName: string,
	regionName: string,
	formValues: Record<string, FormValue>
) => {
	const regionData = getRegionFromUserState(userState, projectName, regionName);
	regionData.formValues = formValues;
	await saveUserState(userState);
};

export const getRegionFromUserState = (userState: UserState, projectName: string, regionName: string): Region => {
	const projectData = getProjectFromUserState(userState, projectName);

	const regionData = projectData.regions.find((r) => r.name === regionName);
	if (!regionData) error(404, `Region "${regionName}" not found in project "${projectName}"`);

	return regionData;
};
export const getProjectFromUserState = (userState: UserState, projectName?: string) => {
	const projectData = userState.projects.find((p) => p.name === projectName);
	if (!projectData) error(404, `Project "${projectName}" not found`);
	return projectData;
};

export const invalidateStrategyForProject = (userState: UserState, projectName: string) => {
	const projectData = getProjectFromUserState(userState, projectName);
	projectData.strategy = undefined;
};
