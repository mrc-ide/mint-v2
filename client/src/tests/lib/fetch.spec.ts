import { describe, it, expect, vi } from 'vitest';
import { apiFetch, ApiError } from '$lib/fetch';
import type { ResponseBodySuccess, ResponseBodyFailure } from '$lib/types/api';

beforeEach(() => {
	vi.resetAllMocks();
});
describe('ApiError', () => {
	it('should create an ApiError with message and status', () => {
		const error = new ApiError('Test error', 404);
		expect(error.message).toBe('Test error');
		expect(error.status).toBe(404);
		expect(error.name).toBe('ApiError');
	});

	it('should be an instance of Error', () => {
		const error = new ApiError('Test error', 500);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ApiError);
	});
});

describe('apiFetch', () => {
	it('should make a successful GET request', async () => {
		const mockData = { data: { id: 1, name: 'test' } };
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => mockData
		});

		const result = await apiFetch({
			url: '/api/test',
			fetcher: mockFetch
		});

		expect(mockFetch).toHaveBeenCalledWith('/api/test', {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});
		expect(result).toEqual(mockData);
	});

	it('should make a successful POST request with body', async () => {
		const mockData = { data: { success: true } };
		const requestBody = { name: 'test' };
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => mockData
		});

		const result = await apiFetch({
			url: '/api/test',
			method: 'POST',
			body: requestBody,
			fetcher: mockFetch
		});

		expect(mockFetch).toHaveBeenCalledWith('/api/test', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});
		expect(result).toEqual(mockData);
	});

	it('should handle PUT, PATCH, and DELETE methods', async () => {
		const mockData = { data: { success: true } };
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => mockData
		});

		await apiFetch({ url: '/api/test', method: 'PUT', fetcher: mockFetch });
		expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'PUT' }));

		await apiFetch({ url: '/api/test', method: 'PATCH', fetcher: mockFetch });
		expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'PATCH' }));

		await apiFetch({ url: '/api/test', method: 'DELETE', fetcher: mockFetch });
		expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'DELETE' }));
	});

	it('should throw ApiError when response is not ok and no data', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			headers: new Headers()
		});

		await expect(apiFetch({ url: '/api/test', fetcher: mockFetch })).rejects.toThrow(
			new ApiError('Request failed with status 500', 500)
		);
	});

	it('should throw ApiError with detail field from response data', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 400,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => ({ detail: 'Bad request error' })
		});

		await expect(apiFetch({ url: '/api/test', fetcher: mockFetch })).rejects.toThrow(
			new ApiError('Bad request error', 400)
		);
	});

	it('should throw ApiError with "Unknown error" if no detail exists', async () => {
		const errorResponse = {};
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => errorResponse
		});

		await expect(apiFetch({ url: '/api/test', fetcher: mockFetch })).rejects.toThrow(
			new ApiError('Unknown error', 500)
		);
	});

	it('should handle non-JSON responses', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Headers({ 'content-type': 'text/plain' })
		});

		const result = await apiFetch({ url: '/api/test', fetcher: mockFetch });

		expect(result).toBeNull();
	});

	it('should return typed response data', async () => {
		interface TestData {
			id: number;
			name: string;
		}
		const mockData: ResponseBodySuccess<TestData> = {
			data: { id: 1, name: 'test' }
		};
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => mockData
		});

		const result = await apiFetch<TestData>({
			url: '/api/test',
			fetcher: mockFetch
		});

		expect(result.data.id).toBe(1);
		expect(result.data.name).toBe('test');
	});
});
