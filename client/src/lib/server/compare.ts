import { ApiError, apiFetch } from '$lib/fetch';
import type { CompareParameters } from '$lib/types/compare';
import { getCompareParametersUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/$types';

export const fetchCompareParameters = async (fetch: RequestEvent['fetch']): Promise<CompareParameters> => {
	try {
		const res = await apiFetch<CompareParameters>({ url: getCompareParametersUrl(), fetcher: fetch });
		return res.data;
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, `Failed to fetch compare parameters`);
	}
};
