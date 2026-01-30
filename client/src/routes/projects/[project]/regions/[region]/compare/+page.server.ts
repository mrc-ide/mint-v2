import { getCompareParameters } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;

	const regionData = getRegionFromUserState(locals.userState, project, region);

	return {
		region: regionData,
		compareParameters: await getCompareParameters(fetch)
	};
};
