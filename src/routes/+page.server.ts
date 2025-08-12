import { setError, superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { createProjectSchema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, type Actions } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const userGuideLanguage = url.searchParams.get('lang') || 'en';

	return {
		userGuideLanguage,
		form: await superValidate(zod(createProjectSchema))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await superValidate(request, zod(createProjectSchema));
		const isDuplicateProjectName = locals.userState.projects.some((project) => project.name === form.data.name);
		if (isDuplicateProjectName) {
			setError(form, 'name', 'Project names must be unique');
		}

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		// if successful, then update local user data
		locals.userState.projects.push({
			name: form.data.name,
			regions: form.data.regions.map((region) => ({ name: region })),
			budget: 2000000, // default budget (TODO: place somewhere better with other defaults)
			canStrategize: false
		});

		return { form };
	},
	// use basic sveltekit form handling for delete
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) {
			return fail(400, { error: 'Project name is required' });
		}
		// if successful, then update local user data
		locals.userState.projects = locals.userState.projects.filter((project) => project.name !== name);

		return { success: true };
	}
};
