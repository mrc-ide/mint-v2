import { fetchCompareParameters, fetchLongTermResults } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import type { CompareParameters } from '$lib/types/compare';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;

	const regionData = getRegionFromUserState(locals.userState, project, region);

	const compareParameters: CompareParameters = await fetchCompareParameters(fetch);

	return {
		region: regionData,
		compareParameters,
		longTermResults: fetchLongTermResults(
			regionData.formValues,
			regionData.longTermFormValues,
			compareParameters,
			fetch
		)
	};
};
