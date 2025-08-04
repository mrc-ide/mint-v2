import redis from '$lib/server/redis';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	await redis.set('name', 'Mint');

	return {
		name: await redis.get('name'),
		userData: locals.userState
	};
};
