import type { Schema } from '$lib/components/dynamic-form/types';
import formSchema from '$lib/server/testRegionForm.json';
import type { Region, TimeSeriesData } from '$lib/types';
import { addRegionSchema } from '$routes/projects/[project]/regions/[region]/schema';
import { error, redirect, type Actions } from '@sveltejs/kit';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

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
		timeSeriesData: runModels(project, region, regionData, fetch)
	};
};
const runModels = async (project: string, region: string, regionData: Region, fetch: typeof window.fetch) => {
	if (!regionData.hasRun) return null;
	// if region has run, run models to get time series data
	const res = await fetch(`/projects/${project}/regions/${region}`, {
		method: 'POST',
		body: JSON.stringify({
			formValues: regionData.formValues
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	// todo handle correctly.. refresh form probably
	if (!res.ok) error(res.status, `Failed to fetch data for region "${region}" in project "${project}"`);
	const timeSeriesData = (await res.json()) as TimeSeriesData;
	return timeSeriesData;
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
