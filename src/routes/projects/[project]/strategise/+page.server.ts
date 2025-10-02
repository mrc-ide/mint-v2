import { ApiError, apiFetch } from '$lib/fetch';
import { getProjectFromUserState } from '$lib/server/region';
import type { StrategiseResults } from '$lib/types/userState';
import { strategiseUrl } from '$lib/url';
import { message, superValidate, type ErrorStatus } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { strategiseSchema } from './schema';
import {
	getCasesAvertedAndCostsForStrategise,
	getMaximumCostForStrategise,
	getMinimumCostForStrategise
} from './utils';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { project } = params;

	const projectData = getProjectFromUserState(locals.userState, project);
	const regionalStrategies = getCasesAvertedAndCostsForStrategise(projectData.regions);
	const maximumCost = getMaximumCostForStrategise(regionalStrategies);

	return {
		project: projectData,
		form: await superValidate(
			{
				minCost: getMinimumCostForStrategise(regionalStrategies),
				maxCost: maximumCost,
				budget: projectData.strategy?.budget || maximumCost,
				regionalStrategies: regionalStrategies
			},
			zod(strategiseSchema)
		)
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
					minCost: form.data.minCost,
					maxCost: form.data.budget,
					regions: form.data.regionalStrategies
				}
			});

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
