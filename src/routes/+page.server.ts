import type { PageServerLoad } from './$types';
import redis from '$lib/server/redis';

export const load: PageServerLoad = async ({ locals }) => {
	await redis.set('name', 'Mint');

	return {
		name: await redis.get('name'),
		userData: locals.userData
	};
};
