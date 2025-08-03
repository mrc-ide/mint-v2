import { REDIS_URL } from '$env/static/private';
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

export const loadOrSetupUserData = async (userId: string): Promise<App.Locals['userData']> => {
	let userData = await redis.hgetall(userId); // TODO: maybe just store as key and string? hget and hset
	if (Object.keys(userData).length === 0) {
		userData = { userId, createdAt: new Date().toISOString() };
		await redis.hset(userId, userData);
	}
	return userData as App.Locals['userData'];
};
