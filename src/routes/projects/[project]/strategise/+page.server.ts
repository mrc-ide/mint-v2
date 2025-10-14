import { getProjectFromUserState } from '$lib/server/region';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { strategiseSchema } from './schema';
import {
	getCasesAvertedAndCostsForStrategise,
	getMaximumCostForStrategise,
	getMinimumCostForStrategise,
	strategise
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
	default: async ({ request, locals, params }) => {
		const { project } = params;
		const projectData = getProjectFromUserState(locals.userState, project);
		const form = await superValidate(request, zod(strategiseSchema));
		if (!form.valid) {
			return { form };
		}

		projectData.strategy = {
			budget: form.data.budget,
			results: strategise(form.data.minCost, form.data.maxCost, form.data.regionalStrategies)
		};

		return { form };
	}
};
