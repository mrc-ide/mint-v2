import { REDIS_URL } from '$env/static/private';
import type { UserState } from '$lib/types';
import Redis from 'ioredis';

const redis = new Redis(REDIS_URL);
redis.on('error', (err: Error) => {
	console.error('Redis connection error:', err);
});
redis.on('connect', () => {
	console.log(`Connected to Redis server ${REDIS_URL}`);
});
redis.on('reconnecting', () => {
	console.log('Reconnecting to Redis...');
});
export default redis;

export const loadOrSetupUserState = async (userId: string): Promise<UserState> => {
	try {
		const cachedUserState: UserState = JSON.parse((await redis.get(userId)) || '{}');
		if (cachedUserState) return cachedUserState;
	} catch (error) {
		console.error('Error parsing user state from Redis:', error);
		// If parsing fails, reset the user state
	}

	const newUserState: UserState = { userId, createdAt: new Date().toISOString(), projects: [] };
	await redis.set(userId, JSON.stringify(newUserState));

	return newUserState;
};

export const saveUserState = async (user: UserState): Promise<void> => {
	try {
		await redis.set(user.userId, JSON.stringify(user));
	} catch (error) {
		console.error('Error saving user state to Redis:', error);
	}
};
