import { REDIS_URL } from '$env/static/private';
import Redis from 'ioredis';

const redis = new Redis(REDIS_URL);
redis.on('error', (err: Error) => {
	console.error('Redis connection error:', err);
	throw new Error(`Failed to connect to Redis: ${err.message}`);
});

redis.on('connect', () => {
	console.log(`Connected to Redis server ${REDIS_URL}`);
});

export default redis;

export const getUserData = async (userId: string) => {
	try {
		const data = await redis.get(userId);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error(`Error fetching user data for ${userId}:`, error);
		throw new Error(`Failed to fetch user data: ${error?.message}`);
	}
};
