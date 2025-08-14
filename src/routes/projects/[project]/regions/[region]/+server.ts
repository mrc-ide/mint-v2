import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveUserState } from '$lib/server/redis';

/**
 * Handle POST requests to run models for a specific region in a project.
 *
 * @returns A JSON response with the time series data for the region.
 */
export const POST: RequestHandler = async ({ request, locals, params }) => {
	const { formValues } = await request.json();
	const { project, region } = params;
	// simulate delay to run model and fetch time series data. TODO: will be getting from r api
	// TODO: depending on if model params changed or not then call another endpoint that just updates cost calculation (cost)
	await new Promise((resolve) => setTimeout(resolve, 2000));
	const { dummyCasesData, dummyPrevalenceData } = getDummyRunData();

	// save in state after getting data
	const userState = locals.userState;
	const projectData = userState.projects.find((p) => p.name === project);
	if (!projectData) error(404, `Project "${project}" not found`);

	const regionData = projectData.regions.find((r) => r.name === region);
	if (!regionData) error(404, `Region "${region}" not found in project "${project}"`);
	regionData.formValues = formValues;
	regionData.hasRun = true;
	saveUserState(userState);

	return json({ prevalenceData: dummyPrevalenceData, casesData: dummyCasesData });
};

// create dummy timeseries data for prevalenceData and casesData that is keyed
// by run and timeseries value
const getDummyRunData = () => {
	const dummyPrevalenceData = {
		run1: [
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 200) + 50 },
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 200) + 50 }
		],
		run2: [
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 200) + 50 },
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 200) + 50 }
		]
	};
	const dummyCasesData = {
		run1: [
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 100) + 10 },
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 100) + 10 }
		],
		run2: [
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 100) + 10 },
			{ id: crypto.randomUUID(), value: Math.floor(Math.random() * 100) + 10 }
		]
	};

	return { dummyPrevalenceData, dummyCasesData };
};
