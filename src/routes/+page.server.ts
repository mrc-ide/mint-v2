import { setError, superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { formSchema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const userGuideLanguage = url.searchParams.get('lang') || 'en';

	return {
		userGuideLanguage,
		form: await superValidate(zod(formSchema))
	};
};

// region names must be unique & project names must be unique!!
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod(formSchema));
		const isDuplicateProjectName = locals.userState.projects.some((project) => project.name === form.data.name);
		if (isDuplicateProjectName) {
			setError(form, 'name', 'Project names must be unique');
		}
		console.log(form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		console.log('Success bitches!!');
		// if successful, then update local user data
		// locals.userState.projects.push({
		// 	name: form.data.name,
		// 	regions: form.data.regions.map((region) => ({ name: region })),
		// 	budget: 2000000 // default budget (TODO: place somewhere better)
		// });

		return { form };
	}
};
