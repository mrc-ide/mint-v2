import type { Region, RunData, UserState } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { saveUserState } from '$lib/server/redis';

export const runModelsOnLoad = async (
	project: string,
	region: string,
	regionData: Region,
	fetch: RequestEvent['fetch']
): Promise<RunData | null> => {
	if (!regionData.hasRun) return null;
	// if region has run, run models to get time series data
	const res = await fetch(`/projects/${project}/regions/${region}`, {
		method: 'POST',
		body: JSON.stringify({
			formValues: regionData.formValues
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	// todo handle correctly.. refresh form probably
	if (!res.ok) error(res.status, `Failed to fetch data for region "${region}" in project "${project}"`);
	return (await res.json()) as RunData;
};

export const saveRegionFormState = async (
	userState: UserState,
	projectName: string,
	regionName: string,
	formValues: Record<string, unknown>
) => {
	const projectData = userState.projects.find((p) => p.name === projectName);
	if (!projectData) error(404, `Project "${projectName}" not found`);

	const regionData = projectData.regions.find((r) => r.name === regionName);
	if (!regionData) error(404, `Region "${regionName}" not found in project "${projectName}"`);
	regionData.formValues = formValues;
	regionData.hasRun = true;
	await saveUserState(userState);
};
