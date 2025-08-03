import { loadOrSetupUserData } from '$lib/server/redis';
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
	}
	event.locals.userData = await loadOrSetupUserData(userId);
	return await resolve(event);
};
