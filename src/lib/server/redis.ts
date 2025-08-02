import { REDIS_URL } from '$env/static/private';
import Redis from 'ioredis';

const redis = new Redis(REDIS_URL, { lazyConnect: true });
redis.on('error', (err: Error) => {
	console.error('Redis connection error:', err);
	throw new Error(`Failed to connect to Redis: ${err.message}`);
});

redis.on('connect', () => {
	console.log(`Connected to Redis server ${REDIS_URL}`);
});

export default redis;

export const getOrCreateUserData = async (userId: string) => {
	let userData = await redis.hgetall(userId);
	if (Object.keys(userData).length === 0) {
		userData = { userId, createdAt: new Date().toISOString() };
		await redis.hset(userId, userData);
	}
	return userData;
};
