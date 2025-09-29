import { ApiError, apiFetch } from '$lib/fetch';
import { getValidatedProjectData } from '$lib/server/region';
import type { StrategiseResults } from '$lib/types/userState';
import { strategiseUrl } from '$lib/url';
import { message, superValidate, type ErrorStatus } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { strategiseSchema } from './schema';
import { getCasesAvertedAndCostsForStrategise } from './utils';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { project } = params;

	const projectData = getValidatedProjectData(locals.userState, project);
	const regionalStrategies = getCasesAvertedAndCostsForStrategise(projectData.regions);

	return {
		project: projectData,
		form: await superValidate(
			{
				budget: projectData.strategy.budget,
				regionalStrategies: regionalStrategies
			},
			zod(strategiseSchema)
		)
	};
};

export const actions: Actions = {
	default: async ({ request, locals, fetch, params }) => {
		const { project } = params;
		const projectData = getValidatedProjectData(locals.userState, project);
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
