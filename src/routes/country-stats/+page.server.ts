import { getCountryCounts } from '$lib/server/redis';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async () => {
	const visits = await getCountryCounts();
	return { visits };
};
