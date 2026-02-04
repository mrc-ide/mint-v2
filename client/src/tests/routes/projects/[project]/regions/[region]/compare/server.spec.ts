import * as regionModule from '$lib/url';
import { MOCK_FORM_VALUES } from '$mocks/mocks';
import { server } from '$mocks/server';
import { POST } from '$routes/projects/[project]/regions/[region]/compare/+server';
import { isHttpError, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('POST', () => {
	it('should run emulator for comparing region and return results', async () => {
		const mockUrl = 'http://localhost:8080/emulator/run';
		vi.spyOn(regionModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
		const expectedResponse = {
			status: 'success',
			errors: null,
			data: {
				cases: [],
				prevalence: []
			}
		};
		server.use(
			http.post(mockUrl, async ({ request }) => {
				const body = await request.clone().json();
				expect(body).toEqual(MOCK_FORM_VALUES);

				return HttpResponse.json(expectedResponse);
			})
		);
		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});

		const response = POST({ request, fetch: fetch.bind(globalThis) } as any);

		const json = await (await response).json();
		expect(json).toEqual(expectedResponse);
	});

	it('should throw error on network request failure', async () => {
		const mockUrl = 'http://localhost:8080/emulator/run';
		vi.spyOn(regionModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
		server.use(
			http.post(mockUrl, () => {
				return HttpResponse.error();
			})
		);

		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});
		try {
			await POST({ request, fetch: fetch.bind(globalThis) } as any);
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			expect((error as HttpError).status).toBe(500);
			expect((error as HttpError).body.message).toBe('Failed to run emulator for comparing region');
		}
	});
});
