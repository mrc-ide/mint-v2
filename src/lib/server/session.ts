import { env } from '$env/dynamic/private';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

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

export const fetchCountry = async (event: RequestEvent): Promise<string | undefined> => {
	try {
		const ip = event.getClientAddress();
		console.log('Client IP address:', ip);
		const res = await fetch(`https://api.ipinfo.io/lite/${ip}?token=${env.IPINFO_TOKEN}`);
		const data = await res.json();
		console.log('IP info response:', data);
		return data.country;
	} catch (error) {
		console.error('Error fetching country from IP info:', error);
		return undefined;
	}
};
