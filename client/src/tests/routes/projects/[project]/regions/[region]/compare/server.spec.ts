import * as urlModule from '$lib/url';
import { MOCK_FORM_VALUES } from '$mocks/mocks';
import { server } from '$mocks/server';
import { POST, PATCH } from '$routes/projects/[project]/regions/[region]/compare/+server';
import { isHttpError, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import * as regionModule from '$lib/server/region';
import type { UserState } from '$lib/types/userState';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('POST', () => {
	const mockUrl = 'http://localhost:8080/emulator/run';
	const params = { project: 'test-project', region: 'test-region' };
	const locals = { userState: {} } as any;

	it('should run emulator for comparing region and return results', async () => {
		const expectedResponse = {
			status: 'success',
			errors: null,
			data: {
				cases: [],
				prevalence: []
			}
		};
		vi.spyOn(urlModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
		server.use(
			http.post(mockUrl, async ({ request }) => {
				const body = await request.clone().json();
				expect(body).toEqual(MOCK_FORM_VALUES);

				return HttpResponse.json(expectedResponse);
			})
		);
		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES, shouldSave: false })
		});

		const response = POST({ request, fetch: fetch.bind(globalThis), params, locals } as any);

		const json = await (await response).json();
		expect(json).toEqual(expectedResponse);
	});

	it("should run emulator and save results when 'shouldSave' is true", async () => {
		const expectedResponse = {
			status: 'success',
			errors: null,
			data: {
				cases: [],
				prevalence: []
			}
		};
		vi.spyOn(urlModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
		const invalidateSpy = vi.spyOn(regionModule, 'invalidateStrategyForProject').mockReturnValue(undefined);
		const saveLongTermSpy = vi.spyOn(regionModule, 'saveLongTermRegionCompare').mockResolvedValue(undefined);

		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES, shouldSave: true })
		});
		server.use(http.post(mockUrl, async () => HttpResponse.json(expectedResponse)));

		const response = await POST({ request, fetch: fetch.bind(globalThis), params, locals } as any);
		await response.json();

		expect(invalidateSpy).toHaveBeenCalledWith(expect.anything(), 'test-project');
		expect(saveLongTermSpy).toHaveBeenCalledWith(
			expect.anything(),
			'test-project',
			'test-region',
			MOCK_FORM_VALUES,
			expectedResponse.data.cases
		);
	});

	it('should throw error on network request failure', async () => {
		vi.spyOn(urlModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
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
			await POST({ request, fetch: fetch.bind(globalThis), params, locals } as any);
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			expect((error as HttpError).status).toBe(500);
			expect((error as HttpError).body.message).toBe('Failed to run emulator for comparing region');
		}
	});
});

describe('PATCH', () => {
	it('should save long term form state and return 204', async () => {
		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: {} as UserState };
		const request = new Request('http://localhost:8080/compare', {
			method: 'PATCH',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});
		const invalidateSpy = vi.spyOn(regionModule, 'invalidateStrategyForProject').mockReturnValue(undefined);
		const saveLongTermFormStateSpy = vi.spyOn(regionModule, 'saveLongTermFormState').mockResolvedValue(undefined);

		const response = await PATCH({ request, params, locals } as any);

		expect(response.status).toBe(204);
		expect(invalidateSpy).toHaveBeenCalledWith(expect.anything(), 'test-project');
		expect(saveLongTermFormStateSpy).toHaveBeenCalledWith(
			expect.anything(),
			'test-project',
			'test-region',
			MOCK_FORM_VALUES
		);
	});
});
