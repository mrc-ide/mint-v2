import { loadOrSetupUserState, saveUserState } from '$lib/server/redis';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/healthz') return await resolve(event);

	event.locals.userState = await loadOrSetupUserState(event.cookies, event);

	const response = await resolve(event);

	// sync user state to Redis after each request
	await saveUserState(event.locals.userState);

	return response;
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	// Log concise, non-sensitive details and the stack for debugging
	console.error({
		timestamp: new Date().toISOString(),
		errorId,
		status,
		message,
		method: event.request.method,
		path: event.url.pathname,
		userId: event.cookies.get('userId') ?? 'unknown ',
		stack: error
	});

	if (status === 500) {
		return {
			message: `An internal server error occurred. Please contact support with Error ID: ${errorId}`
		};
	}
	return { message };
};
