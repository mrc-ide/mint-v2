import redis, { loadOrSetupUserState, registerLocation, getCountryCounts, saveUserState } from '$lib/server/redis';
import type { UserState } from '$lib/types/userState';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import * as session from '$lib/server/session';
import type { Mock } from 'vitest';

// Mock Redis
vi.mock('ioredis', () => {
	const Redis = vi.fn();
	Redis.prototype.get = vi.fn();
	Redis.prototype.set = vi.fn();
	Redis.prototype.hincrby = vi.fn();
	Redis.prototype.hgetall = vi.fn();
	Redis.prototype.on = vi.fn();
	return { default: Redis };
});

// Mock session module
vi.mock(import('$lib/server/session'), () => ({
	setNewUserIdCookie: vi.fn(),
	fetchCountry: vi.fn()
}));

describe('redis on events', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should log connection events', () => {
		const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Simulate events
		vi.mocked(redis.on).mock.calls.forEach(([event, handler]) => {
			if (event === 'connect' || event === 'reconnecting') {
				handler();
			} else if (event === 'error') {
				handler(new Error('Test error'));
			}
		});

		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connected to Redis server'));
		expect(consoleLogSpy).toHaveBeenCalledWith('Reconnecting to Redis...');
		expect(consoleErrorSpy).toHaveBeenCalledWith('Redis connection error:', expect.any(Error));
	});
});

describe('loadOrSetupUserState', () => {
	let mockCookies: Cookies;
	let mockEvent: RequestEvent;

	beforeEach(() => {
		vi.resetAllMocks();
		mockCookies = {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		} as unknown as Cookies;
		mockEvent = {} as RequestEvent;
	});

	it('should return cached user state when valid JSON exists in Redis', async () => {
		const userId = 'test-user-123';
		const cachedState: UserState = {
			userId,
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		(mockCookies.get as Mock).mockReturnValue(userId);
		(redis.get as Mock).mockResolvedValue(JSON.stringify(cachedState));

		const result = await loadOrSetupUserState(mockCookies, mockEvent);

		expect(result).toEqual(cachedState);
		expect(redis.get).toHaveBeenCalledWith(userId);
		expect(session.setNewUserIdCookie).not.toHaveBeenCalled();
	});

	it('should create new user state when no userId cookie exists', async () => {
		const newUserId = 'new-user-456';

		(mockCookies.get as Mock).mockReturnValue('');
		(redis.get as Mock).mockResolvedValue(null);
		(session.setNewUserIdCookie as Mock).mockReturnValue(newUserId);
		(redis.set as Mock).mockResolvedValue('OK');
		(session.fetchCountry as Mock).mockResolvedValue('US');

		const result = await loadOrSetupUserState(mockCookies, mockEvent);

		expect(result.userId).toBe(newUserId);
		expect(result.projects).toEqual([]);
		expect(session.setNewUserIdCookie).toHaveBeenCalledWith(mockCookies);
		expect(redis.set).toHaveBeenCalledWith(newUserId, expect.any(String));
	});

	it('should create new user state when Redis returns null', async () => {
		const userId = 'existing-user-789';
		const newUserId = 'new-user-101';

		(mockCookies.get as Mock).mockReturnValue(userId);
		(redis.get as Mock).mockResolvedValue(null);
		(session.setNewUserIdCookie as Mock).mockReturnValue(newUserId);
		(redis.set as Mock).mockResolvedValue('OK');
		(session.fetchCountry as Mock).mockResolvedValue('UK');

		const result = await loadOrSetupUserState(mockCookies, mockEvent);

		expect(result.userId).toBe(newUserId);
		expect(session.setNewUserIdCookie).toHaveBeenCalledWith(mockCookies);
	});

	it('should reset user state when JSON parsing fails', async () => {
		const userId = 'corrupt-user-111';
		const newUserId = 'new-user-222';
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		(mockCookies.get as Mock).mockReturnValue(userId);
		(redis.get as Mock).mockResolvedValue('invalid-json{');
		(session.setNewUserIdCookie as Mock).mockReturnValue(newUserId);
		(redis.set as Mock).mockResolvedValue('OK');
		(session.fetchCountry as Mock).mockResolvedValue('CA');

		const result = await loadOrSetupUserState(mockCookies, mockEvent);

		expect(result.userId).toBe(newUserId);
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing user state from Redis:', expect.any(Error));
		expect(consoleWarnSpy).toHaveBeenCalledWith('Resetting user state due to parsing error');
		expect(session.setNewUserIdCookie).toHaveBeenCalled();
	});

	it('should create user state with proper ISO date format', async () => {
		const newUserId = 'date-test-user';
		const dateBeforeCall = new Date();

		(mockCookies.get as Mock).mockReturnValue('');
		(redis.get as Mock).mockResolvedValue(null);
		(session.setNewUserIdCookie as Mock).mockReturnValue(newUserId);
		(redis.set as Mock).mockResolvedValue('OK');
		(session.fetchCountry as Mock).mockResolvedValue('FR');

		const result = await loadOrSetupUserState(mockCookies, mockEvent);
		const dateAfterCall = new Date();

		expect(result.createdAt).toBeTruthy();
		const createdDate = new Date(result.createdAt);
		expect(createdDate.getTime()).toBeGreaterThanOrEqual(dateBeforeCall.getTime());
		expect(createdDate.getTime()).toBeLessThanOrEqual(dateAfterCall.getTime());
	});

	it('should call registerLocation when creating new user state', async () => {
		const newUserId = 'location-test-user';

		(mockCookies.get as Mock).mockReturnValue('');
		(redis.get as Mock).mockResolvedValue(null);
		(session.setNewUserIdCookie as Mock).mockReturnValue(newUserId);
		(redis.set as Mock).mockResolvedValue('OK');
		(session.fetchCountry as Mock).mockResolvedValue('DE');

		await loadOrSetupUserState(mockCookies, mockEvent);

		expect(session.fetchCountry).toHaveBeenCalledWith(mockEvent);
	});
});

describe('registerLocation', () => {
	let mockEvent: RequestEvent;

	beforeEach(() => {
		vi.resetAllMocks();
		mockEvent = {} as RequestEvent;
	});

	it('should increment country count when country is returned', async () => {
		(session.fetchCountry as Mock).mockResolvedValue('US');
		(redis.hincrby as Mock).mockResolvedValue(1);

		await registerLocation(mockEvent);

		expect(session.fetchCountry).toHaveBeenCalledWith(mockEvent);
		expect(redis.hincrby).toHaveBeenCalledWith('countryCounts', 'US', 1);
	});

	it('should not increment count when country is undefined', async () => {
		(session.fetchCountry as Mock).mockResolvedValue(undefined);

		await registerLocation(mockEvent);

		expect(session.fetchCountry).toHaveBeenCalledWith(mockEvent);
		expect(redis.hincrby).not.toHaveBeenCalled();
	});

	it('should handle Redis errors gracefully', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		(session.fetchCountry as Mock).mockResolvedValue('UK');
		(redis.hincrby as Mock).mockRejectedValue(new Error('Redis error'));

		await registerLocation(mockEvent);

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error incrementing country count in Redis:', expect.any(Error));
	});
});

describe('getCountryCounts', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should return country counts as numbers', async () => {
		const redisResponse = {
			US: '100',
			UK: '50',
			CA: '25'
		};

		(redis.hgetall as Mock).mockResolvedValue(redisResponse);

		const result = await getCountryCounts();

		expect(result).toEqual({
			US: 100,
			UK: 50,
			CA: 25
		});
		expect(redis.hgetall).toHaveBeenCalledWith('countryCounts');
	});

	it('should return empty object when no counts exist', async () => {
		(redis.hgetall as Mock).mockResolvedValue({});

		const result = await getCountryCounts();

		expect(result).toEqual({});
	});

	it('should return empty object on Redis error', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		(redis.hgetall as Mock).mockRejectedValue(new Error('Redis connection failed'));

		const result = await getCountryCounts();

		expect(result).toEqual({});
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching country counts from Redis:', expect.any(Error));
	});
});

describe('saveUserState', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should save user state to Redis as JSON', async () => {
		const userState: UserState = {
			userId: 'save-test-user',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		(redis.set as Mock).mockResolvedValue('OK');

		await saveUserState(userState);

		expect(redis.set).toHaveBeenCalledWith('save-test-user', JSON.stringify(userState));
	});

	it('should save user state with projects', async () => {
		const userState: UserState = {
			userId: 'project-user',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Test Project',
					regions: []
				}
			]
		};

		(redis.set as Mock).mockResolvedValue('OK');

		await saveUserState(userState);

		const expectedJson = JSON.stringify(userState);
		expect(redis.set).toHaveBeenCalledWith('project-user', expectedJson);
		expect(expectedJson).toContain('Test Project');
	});

	it('should handle Redis errors gracefully', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const userState: UserState = {
			userId: 'error-user',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		(redis.set as Mock).mockRejectedValue(new Error('Redis write error'));

		await saveUserState(userState);

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving user state to Redis:', expect.any(Error));
	});

	it('should not throw error when save fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const userState: UserState = {
			userId: 'fail-user',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		(redis.set as Mock).mockRejectedValue(new Error('Connection lost'));

		await expect(saveUserState(userState)).resolves.not.toThrow();
	});
});
