import { ApiError, apiFetch } from '$lib/fetch';
import { invalidateStrategyForProject, saveLongTermFormState, saveLongTermRegionCompare } from '$lib/server/region';
import type { EmulatorResults } from '$lib/types/userState';
import { runEmulatorUrl } from '$lib/url';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, locals, params }) => {
	const { formValues, shouldSave } = await request.json();
	const { project, region } = params;
	try {
		const res = await apiFetch<EmulatorResults>({
			url: runEmulatorUrl(),
			method: 'POST',
			body: formValues,
			fetcher: fetch
		});

		if (shouldSave) {
			invalidateStrategyForProject(locals.userState, project);
			await saveLongTermRegionCompare(locals.userState, project, region, formValues, res.data.cases);
		}

		return json(res);
	} catch (e) {
		const status = e instanceof ApiError ? e.status : 500;
		error(status, 'Failed to run emulator for comparing region');
	}
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const { formValues } = await request.json();
	const { project, region } = params;

	invalidateStrategyForProject(locals.userState, project);
	await saveLongTermFormState(locals.userState, project, region, formValues);
	return new Response(null, { status: 204 });
};
