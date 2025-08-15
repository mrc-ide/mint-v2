import type { Schema } from '$lib/components/dynamic-region-form/types';
import { saveUserState } from '$lib/server/redis';
import type { Region, ResponseBodySuccess, RunData, UserState } from '$lib/types';
import { regionFormOptions, regionUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/projects/[project]/regions/[region]/$types';

// TODO: sort out types
export const getRegionFormSchema = async (
	projectName: string,
	regionName: string,
	fetch: RequestEvent['fetch']
): Promise<Schema> => {
	const res = await fetch(regionFormOptions());
	if (!res.ok) error(res.status, `Failed to fetch form schema for region "${regionName}" in project "${projectName}"`);
	const form = (await res.json()) as ResponseBodySuccess;
	return form.data as Schema;
};

export const runModelsOnLoad = async (
	projectName: string,
	regionName: string,
	regionData: Region,
	fetch: RequestEvent['fetch']
): Promise<RunData | null> => {
	if (!regionData.hasRun) return null;
	// if region has run, run models to get time series data
	const res = await fetch(regionUrl(projectName, regionName), {
		method: 'POST',
		body: JSON.stringify({
			formValues: regionData.formValues
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	// todo handle correctly.. refresh form probably
	if (!res.ok) error(res.status, `Failed to fetch data for region "${regionName}" in project "${projectName}"`);
	return (await res.json()) as RunData;
};

export const saveRegionFormState = async (
	userState: UserState,
	projectName: string,
	regionName: string,
	formValues: Record<string, unknown>
) => {
	const regionData = getValidatedRegionData(userState, projectName, regionName);
	regionData.formValues = formValues;
	regionData.hasRun = true;
	await saveUserState(userState);
};

export const getValidatedRegionData = (userState: UserState, projectName: string, regionName: string) => {
	const projectData = userState.projects.find((p) => p.name === projectName);
	if (!projectData) error(404, `Project "${projectName}" not found`);

	const regionData = projectData.regions.find((r) => r.name === regionName);
	if (!regionData) error(404, `Region "${regionName}" not found in project "${projectName}"`);

	return regionData;
};
