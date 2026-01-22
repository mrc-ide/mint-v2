import { ApiError, apiFetch } from '$lib/fetch';
import { invalidateStrategyForProject, saveRegionFormState, saveRegionRun } from '$lib/server/region';
import type { EmulatorResults } from '$lib/types/userState';
import { runEmulatorUrl } from '$lib/url';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handle POST requests to run models for a specific region in a project.
 *
 * @returns A JSON response with the time series data for the region.
 */
export const POST: RequestHandler = async ({ request, locals, params, fetch }) => {
	const { formValues } = await request.json();
	const { project, region } = params;

	try {
		const res = await apiFetch<EmulatorResults>({
			url: runEmulatorUrl(),
			method: 'POST',
			body: formValues,
			fetcher: fetch
		});

		invalidateStrategyForProject(locals.userState, project);
		await saveRegionRun(locals.userState, project, region, formValues, res.data.cases);
		return json(res);
	} catch (e) {
		const status = e instanceof ApiError ? e.status : 500;
		error(status, 'Failed to run emulator for region');
	}
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const { formValues } = await request.json();
	const { project, region } = params;

	invalidateStrategyForProject(locals.userState, project);
	await saveRegionFormState(locals.userState, project, region, formValues);
	return new Response(null, { status: 204 });
};
