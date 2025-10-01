import { ApiError, apiFetch } from '$lib/fetch';
import { getProjectFromUserState } from '$lib/server/region';
import type { StrategiseResults } from '$lib/types/userState';
import { strategiseUrl } from '$lib/url';
import { message, superValidate, type ErrorStatus } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { strategiseSchema, type StrategiseRegions } from './schema';
import { getCasesAvertedAndCostsForStrategise } from './utils';

const strategise = async (
	regionalStrategies: StrategiseRegions,
	fetch: RequestEvent['fetch']
): Promise<StrategiseResults[] | null> => {
	if (regionalStrategies.length < 2) return null;
	try {
		const res = await apiFetch<StrategiseResults[]>({
			fetcher: fetch,
			url: strategiseUrl(),
			method: 'POST',
			body: {
				budget: 0, // TODO: needs to be removed
				regions: regionalStrategies
			}
		});
		return res.data;
	} catch (error) {
		console.error('Error fetching strategise data:', error);
	}
	return null;
};

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project } = params;

	const projectData = getProjectFromUserState(locals.userState, project);
	const regionalStrategies = getCasesAvertedAndCostsForStrategise(projectData.regions);

	return {
		project: projectData,
		form: await superValidate(
			{
				budget: projectData.strategy.budget,
				regionalStrategies: regionalStrategies
			},
			zod(strategiseSchema)
		),
		strategisePromise: strategise(regionalStrategies, fetch) // stream as it resolves
	};
};

export const actions: Actions = {
	default: async ({ request, locals, fetch, params }) => {
		const { project } = params;
		const projectData = getProjectFromUserState(locals.userState, project);
		const form = await superValidate(request, zod(strategiseSchema));
		if (!form.valid) {
			return { form };
		}

		try {
			const res = await apiFetch<StrategiseResults[]>({
				fetcher: fetch,
				url: strategiseUrl(),
				method: 'POST',
				body: {
					budget: form.data.budget,
					regions: form.data.regionalStrategies
				}
			});

			// save results to user state
			projectData.strategy = {
				budget: form.data.budget,
				results: res.data
			};
		} catch (e) {
			const status = (e instanceof ApiError ? e.status : 500) as ErrorStatus;
			return message(form, 'Failed to run strategise', { status });
		}

		return { form };
	}
};
