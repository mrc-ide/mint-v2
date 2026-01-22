import { getRegionFormSchema, getRegionFromUserState } from '$lib/server/region';
import { addRegionSchema } from '$routes/projects/[project]/regions/[region]/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;
	const addRegionForm = await superValidate(zod(addRegionSchema));

	const userState = locals.userState;
	const regionData = getRegionFromUserState(userState, project, region);

	return {
		formSchema: await getRegionFormSchema(project, region, fetch),
		region: regionData,
		addRegionForm
	};
};
