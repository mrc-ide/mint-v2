import { ApiError } from '$lib/fetch';
import { runEmulatorsForCompare } from '$lib/server/compare';
import { invalidateStrategyForProject, saveLongTermFormState, saveLongTermRegionCompare } from '$lib/server/region';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, locals, params }) => {
	const { fullLongTermFormValues, baselineLongTermFormValues } = await request.json();
	const { project, region } = params;

	try {
		const { fullLongTerm, baselineLongTerm } = await runEmulatorsForCompare(
			baselineLongTermFormValues,
			fullLongTermFormValues,
			fetch
		);

		invalidateStrategyForProject(locals.userState, project);
		await saveLongTermRegionCompare(locals.userState, project, region, fullLongTermFormValues, fullLongTerm.cases);

		return json({ data: { fullLongTerm, baselineLongTerm } });
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
