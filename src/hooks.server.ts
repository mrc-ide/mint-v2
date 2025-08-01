import redis, { getUserData } from '$lib/server/redis';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	let userId = event.cookies.get('userId');
	if (!userId) {
		userId = crypto.randomUUID();
		event.cookies.set('userId', userId, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 365 // 1 year
		});
		await redis.set(userId, JSON.stringify({ userId, createdAt: new Date().toISOString() }));
	}
	event.locals.userData = await getUserData(userId);

	return await resolve(event);
};
