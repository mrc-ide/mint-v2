import { loadOrSetupUserState } from '$lib/server/redis';
import { getUserIdFromCookies } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = getUserIdFromCookies(event.cookies);
	event.locals.userState = await loadOrSetupUserState(userId);
	return await resolve(event);
};
