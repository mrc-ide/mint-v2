import { env } from '$env/dynamic/private';
import type { UserState } from '$lib/types/userState';
import Redis from 'ioredis';
import { fetchCountry, setNewUserIdCookie } from './session';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { LayoutParams, RouteId } from '$app/types';

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

export const loadOrSetupUserState = async (
	cookies: Cookies,
	event: RequestEvent<LayoutParams<'/'>, RouteId | null>
): Promise<UserState> => {
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

const createAndPersistNewUserState = async (
	cookies: Cookies,
	event: RequestEvent<LayoutParams<'/'>, RouteId | null>
): Promise<UserState> => {
	const newUserId = setNewUserIdCookie(cookies);
	const newUserState: UserState = await setupNewUserState(newUserId, event);
	await redis.set(newUserId, JSON.stringify(newUserState));
	return newUserState;
};

export const setupNewUserState = async (userId: string, event: RequestEvent<LayoutParams<'/'>, RouteId | null>) => {
	const country = await fetchCountry(event);
	await incrementCountryCount(country);
	return { userId, createdAt: new Date().toISOString(), projects: [], country };
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

export const getCountryCounts = async (): Promise<Record<string, string>> => {
	try {
		const counts = await redis.hgetall(COUNTRY_COUNT_KEY);
		return counts;
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
