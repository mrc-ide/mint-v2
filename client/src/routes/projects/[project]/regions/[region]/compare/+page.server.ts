import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { apiFetch } from '$lib/fetch';
import { fetchCompareParameters } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import type { CompareParameters } from '$lib/types/compare';
import type { EmulatorResults } from '$lib/types/userState';
import { runEmulatorUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../$types';
import type { PageServerLoad } from './$types';
import { ApiError } from '$lib/fetch';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const { project, region } = params;

	const regionData = getRegionFromUserState(locals.userState, project, region);

	const compareParameters = await fetchCompareParameters(fetch);

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

const fetchLongTermResults = async (
	presentFormValues: Record<string, FormValue>,
	longTermFormValues: Record<string, FormValue> | undefined,
	compareParameters: CompareParameters,
	fetch: RequestEvent['fetch']
): Promise<{ fullLongTerm: EmulatorResults; baselineLongTerm: EmulatorResults } | undefined> => {
	if (!longTermFormValues) return undefined;
	const compareParamsAsNewFormValues = compareParameters.baselineParameters.reduce(
		(acc, param) => {
			acc[param.parameterName] = longTermFormValues[param.parameterName];
			return acc;
		},
		{} as Record<string, FormValue>
	);

	const fullLongTermPromise = apiFetch<EmulatorResults>({
		url: runEmulatorUrl(),
		fetcher: fetch,
		method: 'POST',
		body: longTermFormValues
	});
	const baselineLongTermPromise = apiFetch<EmulatorResults>({
		url: runEmulatorUrl(),
		fetcher: fetch,
		method: 'POST',
		body: {
			...presentFormValues,
			...compareParamsAsNewFormValues
		}
	});

	try {
		const [{ data: fullLongTerm }, { data: baselineLongTerm }] = await Promise.all([
			fullLongTermPromise,
			baselineLongTermPromise
		]);
		return {
			fullLongTerm,
			baselineLongTerm
		};
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, 'Failed to fetch long term results. Please try again later.');
	}
};
