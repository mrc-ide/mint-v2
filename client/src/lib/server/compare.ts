import { ApiError, apiFetch } from '$lib/fetch';
import type { CompareParameters } from '$lib/types/compare';
import { getCompareParametersUrl, runEmulatorUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/$types';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import type { EmulatorResults } from '$lib/types/userState';

export const fetchCompareParameters = async (fetch: RequestEvent['fetch']): Promise<CompareParameters> => {
	try {
		const res = await apiFetch<CompareParameters>({ url: getCompareParametersUrl(), fetcher: fetch });
		return res.data;
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, `Failed to fetch compare parameters`);
	}
};

export const fetchLongTermResults = async (
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
	const baselineLongTermFormValues = {
		...presentFormValues,
		...compareParamsAsNewFormValues
	};

	try {
		return await runEmulatorsForCompare(baselineLongTermFormValues, longTermFormValues, fetch);
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, 'Failed to fetch long term results. Please try again later.');
	}
};

export const runEmulatorsForCompare = async (
	baselineLongTermFormValues: Record<string, FormValue>,
	longTermFormValues: Record<string, FormValue>,
	fetch: RequestEvent['fetch']
) => {
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
		body: baselineLongTermFormValues
	});

	const [{ data: fullLongTerm }, { data: baselineLongTerm }] = await Promise.all([
		fullLongTermPromise,
		baselineLongTermPromise
	]);

	return {
		fullLongTerm,
		baselineLongTerm
	};
};
