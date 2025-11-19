import { fetchCountry, setNewUserIdCookie } from '$lib/server/session';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { Mock } from 'vitest';

describe('setNewUserIdCookie', () => {
	let mockCookies: Cookies;

	beforeEach(() => {
		vi.resetAllMocks();
		mockCookies = {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		} as unknown as Cookies;
	});

	it('should set cookie with new uuid and security options', () => {
		const userId = setNewUserIdCookie(mockCookies);

		expect(mockCookies.set).toHaveBeenCalledWith('userId', userId, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 365
		});
	});
});

describe('fetchCountry', () => {
	let mockEvent: RequestEvent;
	let originalFetch: typeof fetch;

	beforeEach(() => {
		vi.resetAllMocks();
		originalFetch = global.fetch;
		global.fetch = vi.fn();

		mockEvent = {
			getClientAddress: vi.fn().mockReturnValue('192.168.1.1')
		} as unknown as RequestEvent;
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it('should fetch and return country code from IP info', async () => {
		const mockResponse = {
			country: 'US',
			ip: '192.168.1.1'
		};

		(global.fetch as Mock).mockResolvedValue({
			json: vi.fn().mockResolvedValue(mockResponse)
		});

		const result = await fetchCountry(mockEvent);

		expect(result).toBe('US');
		expect(mockEvent.getClientAddress).toHaveBeenCalled();
		expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.ipinfo.io/lite/192.168.1.1?token'));
	});

	it('should return undefined when fetch fails', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		(global.fetch as Mock).mockRejectedValue(new Error('Network error'));

		const result = await fetchCountry(mockEvent);

		expect(result).toBeUndefined();
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching country from IP info:', expect.any(Error));

		consoleErrorSpy.mockRestore();
	});

	it('should return undefined when JSON parsing fails', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		(global.fetch as Mock).mockResolvedValue({
			json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
		});

		const result = await fetchCountry(mockEvent);

		expect(result).toBeUndefined();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});
