import type { Region, RunData, UserState } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/projects/[project]/regions/[region]/$types';
import { saveUserState } from '$lib/server/redis';
import type { Schema } from '$lib/components/dynamic-form/types';

export const getRegionUrl = (projectName: string, regionName: string) =>
	`/projects/${projectName}/regions/${regionName}`;

export const getRegionFormSchema = async (projectName: string, regionName: string, fetch: RequestEvent['fetch']) => {
	const res = await fetch(getRegionUrl(projectName, regionName));
	if (!res.ok) error(res.status, `Failed to fetch form schema for region "${regionName}" in project "${projectName}"`);
	return (await res.json()) as Schema;
};

export const runModelsOnLoad = async (
	projectName: string,
	regionName: string,
	regionData: Region,
	fetch: RequestEvent['fetch']
): Promise<RunData | null> => {
	if (!regionData.hasRun) return null;
	// if region has run, run models to get time series data
	const res = await fetch(getRegionUrl(projectName, regionName), {
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
