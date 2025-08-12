import type { Cookies } from '@sveltejs/kit';

export const setNewUserIdCookie = (cookies: Cookies) => {
	const userId = crypto.randomUUID();

	cookies.set('userId', userId, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365 // 1 year (TODO: chat and see if we want to do on this?)
	});

	return userId;
};
