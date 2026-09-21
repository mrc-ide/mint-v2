import type { DynamicFormSchema } from '$lib/components/dynamic-region-form/types';
import { decodeCsvBytes } from '$lib/csv';
import { ApiError } from '$lib/fetch';
import type { Project } from '$lib/types/userState';
import { parseProjectCsv } from '$lib/server/projectCsv';
import { getFormSchema } from '$lib/server/region';
import { error, fail, type Actions } from '@sveltejs/kit';
import { message, setError, superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { createProjectSchema, uploadProjectSchema } from './schema';

export const load: PageServerLoad = async ({ url }) => {
	const userGuideLanguage = url.searchParams.get('lang') || 'en';

	return {
		userGuideLanguage,
		form: await superValidate(zod4(createProjectSchema)),
		uploadForm: await superValidate(zod4(uploadProjectSchema))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createProjectSchema));
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
			regions: form.data.regions.map((region) => ({
				name: region,
				formValues: {},
				hasRunBaseline: false
			}))
		});

		return { form };
	},
	upload: async ({ request, locals, fetch }) => {
		const form = await superValidate(request, zod4(uploadProjectSchema), { allowFiles: true });
		const isDuplicateProjectName = locals.userState.projects.some((project) => project.name === form.data.name);
		if (isDuplicateProjectName) {
			setError(form, 'name', 'Project names must be unique');
		}

		if (!form.valid) {
			return fail(400, withFiles({ form }));
		}

		let formSchema: DynamicFormSchema;
		try {
			formSchema = await getFormSchema(fetch);
		} catch (e) {
			error(e instanceof ApiError ? e.status : 500, 'Failed to fetch the region form schema');
		}
		const { regions, errors } = parseProjectCsv(decodeCsvBytes(await form.data.file.arrayBuffer()), formSchema);
		if (errors.length) {
			setError(form, 'file', errors);
			return fail(400, withFiles({ form }));
		}

		// if successful, then update local user data
		locals.userState.projects.push({ name: form.data.name, regions });

		return withFiles(message(form, { name: form.data.name, regions } satisfies Project));
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
	},
	// use basic sveltekit form handling for toggling compare mode
	setCompareEnabled: async ({ request, locals }) => {
		const formData = await request.formData();
		const compareEnabled = formData.get('compare-enabled-switch') === 'on';
		locals.userState.compareEnabled = compareEnabled;

		return { success: true };
	}
};
