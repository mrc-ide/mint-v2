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

	if ('message' in data) {
		throw new ApiError(data.message, res.status);
	}

	console.error(data);
	const errors = (data as ResponseBodyFailure).errors;
	const errorMessage = errors[0]?.detail || errors[0]?.error || 'Unknown error';
	throw new ApiError(errorMessage, res.status);
};
