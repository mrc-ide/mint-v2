import { env } from '$env/dynamic/private';
import type { UserState } from '$lib/types/userState';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import Redis from 'ioredis';
import { fetchCountry, setNewUserIdCookie } from './session';

const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true });
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

export const loadOrSetupUserState = async (cookies: Cookies, event: RequestEvent): Promise<UserState> => {
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
	return createAndPersistNewUserState(cookies, event);
};

const createAndPersistNewUserState = async (cookies: Cookies, event: RequestEvent): Promise<UserState> => {
	const newUserId = setNewUserIdCookie(cookies);
	const newUserState: UserState = { userId: newUserId, createdAt: new Date().toISOString(), projects: [] };
	await redis.set(newUserId, JSON.stringify(newUserState));
	await registerLocation(event);
	return newUserState;
};

export const registerLocation = async (event: RequestEvent) => {
	const country = await fetchCountry(event);
	await incrementCountryCount(country);
};

const COUNTRY_COUNT_KEY = 'countryCounts';
const incrementCountryCount = async (country: string | undefined) => {
	if (!country) return;
	try {
		await redis.hincrby(COUNTRY_COUNT_KEY, country, 1);
	} catch (error) {
		console.error('Error incrementing country count in Redis:', error);
	}
};

export const getCountryCounts = async (): Promise<Record<string, number>> => {
	try {
		const counts = await redis.hgetall(COUNTRY_COUNT_KEY);
		const numericCounts = Object.entries(counts).reduce(
			(acc, [key, value]) => ({ ...acc, [key]: Number(value) }),
			{} as Record<string, number>
		);

		return numericCounts;
	} catch (error) {
		console.error('Error fetching country counts from Redis:', error);
		return {};
	}
};

export const saveUserState = async (user: UserState): Promise<void> => {
	try {
		await redis.set(user.userId, JSON.stringify(user));
	} catch (error) {
		console.error('Error saving user state to Redis:', error);
	}
};
