import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handle, handleError } from '../hooks.server';
import * as redis from '$lib/server/redis';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

// Mock Redis functions
vi.mock(import('$lib/server/redis'), () => ({
	loadOrSetupUserState: vi.fn(),
	saveUserState: vi.fn()
}));

describe('handle', () => {
	let mockEvent: Partial<RequestEvent>;
	let mockResolve: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockResolve = vi.fn().mockResolvedValue(new Response('OK'));

		mockEvent = {
			url: new URL('http://localhost:5173/test'),
			cookies: {} as unknown as Cookies,
			locals: {} as App.Locals,
			request: new Request('http://localhost:5173/test')
		};

		vi.mocked(redis.loadOrSetupUserState).mockResolvedValue({
			userId: 'test-user-id',
			projects: []
		} as any);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should bypass middleware for /healthz endpoint', async () => {
		mockEvent.url = new URL('http://localhost:5173/healthz');

		await handle({ event: mockEvent as RequestEvent, resolve: mockResolve as any });

		expect(redis.loadOrSetupUserState).not.toHaveBeenCalled();
		expect(redis.saveUserState).not.toHaveBeenCalled();
		expect(mockResolve).toHaveBeenCalledWith(mockEvent);
	});

	it('should load user state before request & save user state after request', async () => {
		await handle({ event: mockEvent as RequestEvent, resolve: mockResolve as any });

		expect(redis.loadOrSetupUserState).toHaveBeenCalledWith(mockEvent.cookies, mockEvent);
		expect(mockEvent.locals!.userState).toEqual({
			userId: 'test-user-id',
			projects: []
		});
		expect(redis.saveUserState).toHaveBeenCalledWith(mockEvent.locals!.userState);
		expect(mockResolve).toHaveBeenCalledWith(mockEvent);
	});

	it('should return response from resolve', async () => {
		const expectedResponse = new Response('Test Response');
		mockResolve.mockResolvedValue(expectedResponse);

		const response = await handle({ event: mockEvent as RequestEvent, resolve: mockResolve as any });

		expect(response).toBe(expectedResponse);
	});
});

describe('handleError', () => {
	let mockEvent: Partial<RequestEvent>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mockEvent = {
			url: new URL('http://localhost:5173/test'),
			cookies: {
				get: vi.fn().mockReturnValue('test-user-123'),
				set: vi.fn(),
				delete: vi.fn(),
				serialize: vi.fn(),
				getAll: vi.fn()
			},
			request: new Request('http://localhost:5173/test', { method: 'POST' })
		};

		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-error-id' as any);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should log error details with errorId', async () => {
		const error = new Error('Test error');
		const status = 500;
		const message = 'Internal Server Error';

		await handleError({ error, event: mockEvent as RequestEvent, status, message });

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				errorId: 'mock-error-id',
				status: 500,
				message: 'Internal Server Error',
				method: 'POST',
				path: '/test',
				userId: 'test-user-123',
				stack: error
			})
		);
		expect(consoleErrorSpy.mock.calls[0][0]).toHaveProperty('timestamp');
	});

	it('should log unknown userId when cookie is missing', async () => {
		vi.mocked(mockEvent.cookies!.get).mockReturnValue(undefined);

		await handleError({
			error: new Error('Test'),
			event: mockEvent as RequestEvent,
			status: 404,
			message: 'Not Found'
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'unknown'
			})
		);
	});

	it('should return generic message with errorId for 500 errors', async () => {
		const result = await handleError({
			error: new Error('Database connection failed'),
			event: mockEvent as RequestEvent,
			status: 500,
			message: 'Internal Server Error'
		});

		expect(result).toEqual({
			message: 'An internal server error occurred. Please contact support with Error ID: mock-error-id'
		});
	});

	it('should return original message for non-500 errors', async () => {
		const result = await handleError({
			error: new Error('Not found'),
			event: mockEvent as RequestEvent,
			status: 404,
			message: 'Page not found'
		});

		expect(result).toEqual({
			message: 'Page not found'
		});
	});
});
