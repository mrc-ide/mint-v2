import type { Schema } from '$lib/components/dynamic-form/types';
import { addRegionSchema } from '$routes/projects/[project]/regions/[region]/schema';
import { error, redirect, type Actions } from '@sveltejs/kit';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import formSchema from './testRegionForm.json'; // TODO: will fetch from R api
import { runModelsOnLoad } from './utils';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;
	const addRegionForm = await superValidate(zod(addRegionSchema));

	const userState = locals.userState;
	const projectData = userState.projects.find((p) => p.name === project);
	if (!projectData) error(404, `Project "${project}" not found`);

	const regionData = projectData.regions.find((r) => r.name === region);
	if (!regionData) error(404, `Region "${region}" not found in project "${project}"`);

	return {
		project: projectData,
		region: regionData,
		addRegionForm,
		formSchema: formSchema as Schema,
		runDataPromise: runModelsOnLoad(project, region, regionData, fetch)
	};
};
export const actions: Actions = {
	addRegion: async ({ request, params, locals }) => {
		const { project } = params;
		const addRegionForm = await superValidate(request, zod(addRegionSchema));

		const projectData = locals.userState.projects.find((p) => p.name === project);
		if (!projectData) {
			return fail(404, { addRegionForm, error: `Project "${project}" not found` });
		}

		const isRegionDuplicate = projectData.regions.some((r) => r.name === addRegionForm.data.name);
		if (isRegionDuplicate) {
			setError(addRegionForm, 'name', 'Region names must be unique');
		}
		if (!addRegionForm.valid) {
			return fail(400, { addRegionForm });
		}

		projectData.regions.push({
			name: addRegionForm.data.name,
			formValues: {},
			hasRun: false
		});

		return redirect(303, `/projects/${project}/regions/${addRegionForm.data.name}`);
	}
};
