import { getValidatedProjectData } from '$lib/server/region';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { strategiseSchema } from './schema';
import type { Actions } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { project } = params;

	const projectData = getValidatedProjectData(locals.userState, project);

	return {
		project: projectData,
		form: await superValidate({ budget: projectData.strategy.budget }, zod(strategiseSchema))
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod(strategiseSchema));
		if (!form.valid) {
			return { form };
		}
		console.log(form.data);
		// todo: get strategy results and save to user data

		return { form };
	}
};
