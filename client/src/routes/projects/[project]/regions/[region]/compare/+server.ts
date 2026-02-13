import { ApiError, apiFetch } from '$lib/fetch';
import type { EmulatorResults } from '$lib/types/userState';
import { runEmulatorUrl } from '$lib/url';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { formValues } = await request.json();
	try {
		const res = await apiFetch<EmulatorResults>({
			url: runEmulatorUrl(),
			method: 'POST',
			body: formValues,
			fetcher: fetch
		});

		return json(res);
	} catch (e) {
		const status = e instanceof ApiError ? e.status : 500;
		error(status, 'Failed to run emulator for comparing region');
	}
};
