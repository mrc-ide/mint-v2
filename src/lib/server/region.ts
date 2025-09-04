import type { DynamicFormSchema, FormValue } from '$lib/components/dynamic-region-form/types';
import { saveUserState } from '$lib/server/redis';
import type { EmulatorResults, Region, UserState } from '$lib/types/userState';
import { regionFormUrl, runEmulatorUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/projects/[project]/regions/[region]/$types';
import { ApiError, apiFetch } from '$lib/fetch';
import resultsJson from '$lib/results/lsm-irs.json';

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

export const runEmulatorOnLoad = async (
	regionData: Region,
	fetch: RequestEvent['fetch']
): Promise<EmulatorResults | null> => {
	if (!regionData.hasRunBaseline) return null;
	// if region has run, run models to get time series data
	try {
		// const res = await apiFetch<EmulatorResults>({
		// 	url: runEmulatorUrl(),
		// 	method: 'POST',
		// 	body: regionData.formValues,
		// 	fetcher: fetch
		// });
		return resultsJson;
	} catch (e) {
		// This promise cannot throw as its during page load & will cause app to crash. Thus return null for data
		console.error(e);
	}
	return null;
};

export const saveRegionFormState = async (
	userState: UserState,
	projectName: string,
	regionName: string,
	formValues: Record<string, FormValue>
) => {
	const regionData = getValidatedRegionData(userState, projectName, regionName);
	regionData.formValues = formValues;
	regionData.hasRunBaseline = true;
	await saveUserState(userState);
};

export const getValidatedRegionData = (userState: UserState, projectName: string, regionName: string): Region => {
	const projectData = userState.projects.find((p) => p.name === projectName);
	if (!projectData) error(404, `Project "${projectName}" not found`);

	const regionData = projectData.regions.find((r) => r.name === regionName);
	if (!regionData) error(404, `Region "${regionName}" not found in project "${projectName}"`);

	return regionData;
};
