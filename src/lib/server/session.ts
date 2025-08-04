import type { Cookies } from '@sveltejs/kit';

export const getUserIdFromCookies = (cookies: Cookies): string => {
	const userId = cookies.get('userId');
	if (userId) return userId;

	const newUserId = crypto.randomUUID();

	cookies.set('userId', newUserId, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365 // 1 year
	});

	return newUserId;
};
