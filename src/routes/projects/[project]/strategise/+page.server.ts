import { getProjectFromUserState } from '$lib/server/region';
import { fail, superValidate } from 'sveltekit-superforms';
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
		regionalStrategies,
		form: await superValidate(
			{
				minCost: getMinimumCostForStrategise(regionalStrategies),
				maxCost: maximumCost,
				budget: projectData.strategy?.budget || maximumCost
			},
			zod(strategiseSchema)
		)
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const { project } = params;
		const projectData = getProjectFromUserState(locals.userState, project);
		const form = await superValidate(request, zod(strategiseSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		projectData.strategy = {
			budget: form.data.budget,
			results: form.data.strategiseResults
		};

		return { form };
	}
};
