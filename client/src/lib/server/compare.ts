import { ApiError, apiFetch } from '$lib/fetch';
import type { CompareParameters } from '$lib/types/compare';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/$types';
import { getCompareParametersUrl } from '$lib/url';

export const getCompareParameters = async (fetch: RequestEvent['fetch']): Promise<CompareParameters> => {
	try {
		const res = await apiFetch<CompareParameters>({ url: getCompareParametersUrl(), fetcher: fetch });
		return res.data;
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, `Failed to fetch compare parameters`);
	}
};
