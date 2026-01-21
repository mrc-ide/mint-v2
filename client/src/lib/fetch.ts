import type { ResponseBody, ResponseBodyFailure, ResponseBodySuccess } from './types/api';

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message); // Pass the message to the Error constructor
		this.name = 'ApiError'; // Set the name of the error
		this.status = status; // Set the status
	}
}

export interface Fetcher {
	url: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: object;
	json?: boolean;
	fetcher?: typeof fetch;
}

export const apiFetch = async <T>({ url, method = 'GET', body, fetcher = fetch }: Fetcher) => {
	const res = await fetcher(url, {
		method,
		...(body && { body: JSON.stringify(body) }),
		headers: {
			Accept: 'application/json',
			...(body && { 'Content-Type': 'application/json' })
		}
	});

	const isJson = res.headers.get('content-type')?.includes('application/json');
	const data: ResponseBody<T> | null = isJson ? await res.json() : null;

	if (res.ok) {
		return data as ResponseBodySuccess<T>;
	}

	if (!data) {
		throw new ApiError(`Request failed with status ${res.status}`, res.status);
	}

	console.error('API Fetch Error:', data);
	let errorMessage = 'Unknown error occurred';
	// App.Error type from sveltekit
	if ('message' in data) errorMessage = data.message;
	// ResponseBodyFailure type
	if ('detail' in data) errorMessage = data.detail;

	throw new ApiError(errorMessage, res.status);
};
