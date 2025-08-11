import { loadOrSetupUserState, saveUserState } from '$lib/server/redis';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('userId');
	event.locals.userState = await loadOrSetupUserState(userId, event.cookies);

	const response = await resolve(event);

	// sync user state to Redis after each request
	await saveUserState(event.locals.userState);

	return response;
};
