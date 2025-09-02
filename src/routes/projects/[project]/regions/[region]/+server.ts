import { saveRegionFormState } from '$lib/server/region';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runEmulatorUrl } from '$lib/url';
import type { EmulatorResults } from '$lib/types/userState';
import type { ResponseBody } from '$lib/types/api';

/**
 * Handle POST requests to run models for a specific region in a project.
 *
 * @returns A JSON response with the time series data for the region.
 */
export const POST: RequestHandler = async ({ request, locals, params, fetch }) => {
	const { formValues } = await request.json();
	const { project, region } = params;

	const res = await fetch(runEmulatorUrl(), {
		method: 'POST',
		body: JSON.stringify(formValues),
		headers: { 'Content-Type': 'application/json' }
	});

	const body = (await res.json()) as ResponseBody<EmulatorResults>;
	if (!res.ok) {
		console.error(body);
		error(res.status, 'Failed to run emulator for region');
	}
	await saveRegionFormState(locals.userState, project, region, formValues);

	return json(body.data);
};
