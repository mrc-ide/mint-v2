import { env } from '$env/dynamic/private';
import type { UserState } from '$lib/types/userState';
import Redis from 'ioredis';
import { setNewUserIdCookie } from './session';
import type { Cookies } from '@sveltejs/kit';

const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
redis.on('error', (err: Error) => {
	console.error('Redis connection error:', err);
});
redis.on('connect', () => {
	console.log(`Connected to Redis server ${env.REDIS_URL}`);
});
redis.on('reconnecting', () => {
	console.log('Reconnecting to Redis...');
});
export default redis;

export const loadOrSetupUserState = async (cookies: Cookies): Promise<UserState> => {
	const userId = cookies.get('userId') || '';
	const cachedUserState = await redis.get(userId);
	if (cachedUserState) {
		try {
			return JSON.parse(cachedUserState);
		} catch (error) {
			console.error('Error parsing user state from Redis:', error);
			// If parsing fails, reset the user state with new User ID
			console.warn('Resetting user state due to parsing error');
		}
	}

	// If no cached user state exists or error occurs, create a new one
	return createAndPersistNewUserState(cookies);
};

const createAndPersistNewUserState = async (cookies: Cookies): Promise<UserState> => {
	const newUserId = setNewUserIdCookie(cookies);
	const newUserState: UserState = { userId: newUserId, createdAt: new Date().toISOString(), projects: [] };
	await redis.set(newUserId, JSON.stringify(newUserState));
	return newUserState;
};

export const saveUserState = async (user: UserState): Promise<void> => {
	try {
		await redis.set(user.userId, JSON.stringify(user));
	} catch (error) {
		console.error('Error saving user state to Redis:', error);
	}
};
