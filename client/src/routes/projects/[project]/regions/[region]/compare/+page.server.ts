import { fetchCompareParameters, getCompareParametersWithValue } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;

	const regionData = getRegionFromUserState(locals.userState, project, region);
	const compareParametersWithValues = getCompareParametersWithValue(
		await fetchCompareParameters(fetch),
		regionData.formValues
	);

	return {
		region: regionData,
		compareParameters: compareParametersWithValues
	};
};
