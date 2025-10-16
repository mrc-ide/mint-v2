import { loadOrSetupUserState, saveUserState } from '$lib/server/redis';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/healthz') return resolve(event);

	event.locals.userState = await loadOrSetupUserState(event.cookies, event);

	const response = await resolve(event);

	// sync user state to Redis after each request
	await saveUserState(event.locals.userState);

	return response;
};
