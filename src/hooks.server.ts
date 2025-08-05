import { loadOrSetupUserState, saveUserState } from '$lib/server/redis';
import { getUserIdFromCookies } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = getUserIdFromCookies(event.cookies);
	event.locals.userState = await loadOrSetupUserState(userId);

	const response = await resolve(event);

	// sync user state to Redis after each request
	await saveUserState(event.locals.userState);

	return response;
};
