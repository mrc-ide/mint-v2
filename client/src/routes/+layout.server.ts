import { ApiError, apiFetch } from '$lib/fetch';
import { versionUrl } from '$lib/url';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	try {
		const response = await apiFetch<{ server: string; minte: string }>({
			url: versionUrl(),
			fetcher: fetch
		});

		return {
			userData: locals.userState,
			versionInfo: response.data
		};
	} catch (e) {
		const errorStatus = e instanceof ApiError ? e.status : 500;
		error(errorStatus, `Failed to fetch version info from server`);
	}
};
