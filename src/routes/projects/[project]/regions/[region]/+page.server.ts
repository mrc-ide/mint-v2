import { getRegionFormSchema, getValidatedRegionData, runModelsOnLoad } from '$lib/server/region';
import { regionUrl } from '$lib/url';
import { addRegionSchema } from '$routes/projects/[project]/regions/[region]/schema';
import { redirect, type Actions } from '@sveltejs/kit';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;
	const addRegionForm = await superValidate(zod(addRegionSchema));

	const userState = locals.userState;
	const regionData = getValidatedRegionData(userState, project, region);

	return {
		formSchema: await getRegionFormSchema(project, region, fetch),
		region: regionData,
		addRegionForm,
		// TODO: will go directly to R api to run
		runPromise: runModelsOnLoad(project, region, regionData, fetch) // stream as it resolves
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

		return redirect(303, regionUrl(projectData.name, addRegionForm.data.name));
	}
};
