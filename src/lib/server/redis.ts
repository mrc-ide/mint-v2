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

export const loadOrSetupUserState = async (userId: string): Promise<App.Locals['userState']> => {
	let userState = await redis.hgetall(userId); // TODO: maybe just store as key and string? hget and hset
	if (Object.keys(userState).length === 0) {
		userState = { userId, createdAt: new Date().toISOString() };
		await redis.hset(userId, userState);
	}
	return userState as App.Locals['userState'];
};
