import { saveRegionFormState } from '$lib/server/region';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handle POST requests to run models for a specific region in a project.
 *
 * @returns A JSON response with the time series data for the region.
 */
export const POST: RequestHandler = async ({ request, locals, params }) => {
	const { formValues, triggerRun = true } = await request.json();
	const { project, region } = params;
	// TODO: depending on if model params changed or not then call another endpoint that just updates cost calculation (cost)
	console.log(triggerRun, 'triggerRun');
	// simulate delay to run model and fetch time series data. TODO: will be getting from r api
	await new Promise((resolve) => setTimeout(resolve, 2000));
	const { dummyCasesData, dummyPrevalenceData } = getDummyRunData();

	await saveRegionFormState(locals.userState, project, region, formValues);

	return json({ prevalenceData: dummyPrevalenceData, casesData: dummyCasesData });
};

// create dummy timeseries data for prevalenceData and casesData that is keyed
// by run and timeseries value
// TODO: remove after hooked with R
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
