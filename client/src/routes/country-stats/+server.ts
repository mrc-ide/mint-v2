import { getCountryCounts } from '$lib/server/redis';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const visits = await getCountryCounts();
	return json(visits);
};
