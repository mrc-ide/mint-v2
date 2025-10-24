import { HttpResponse, http } from 'msw';
import { server } from '$mocks/server';
import { PATCH, POST } from '$routes/projects/[project]/regions/[region]/+server';
import { MOCK_FORM_VALUES } from '$mocks/mocks';
import * as regionModule from '$lib/server/region';
import { isHttpError, type HttpError } from '@sveltejs/kit';

describe('POST', () => {
	it('should run emulator and save region run', async () => {
		vi.spyOn(regionModule, 'invalidateStrategyForProject').mockImplementation(() => {});
		vi.spyOn(regionModule, 'saveRegionRun').mockImplementation(() => Promise.resolve());
		const expectedResponse = {
			status: 'success',
			errors: null,
			data: {
				cases: [],
				prevalence: []
			}
		};
		server.use(
			http.post('*/emulator/run', async ({ request }) => {
				const body = await request.clone().json();
				expect(body).toEqual(MOCK_FORM_VALUES);

				return HttpResponse.json(expectedResponse);
			})
		);
		const request = new Request(new URL('http://localhost:3000'), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});
		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };
		const response = POST({ request, locals, params, fetch: fetch.bind(globalThis) } as any);

		const json = await (await response).json();
		expect(json).toEqual(expectedResponse);
		expect(regionModule.invalidateStrategyForProject).toHaveBeenCalledWith(locals.userState, params.project);
		expect(regionModule.saveRegionRun).toHaveBeenCalledWith(
			locals.userState,
			params.project,
			params.region,
			MOCK_FORM_VALUES,
			expectedResponse.data.cases
		);
	});

	it('should throw error on network request', async () => {
		server.use(
			http.post('*/emulator/run', () => {
				return HttpResponse.error();
			})
		);

		const request = new Request(new URL('http://localhost:3000'), {
			method: 'POST',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});
		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };

		try {
			await POST({ request, locals, params, fetch: fetch.bind(globalThis) } as any);
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			expect((error as HttpError).status).toBe(500);
			expect((error as HttpError).body.message).toBe('Failed to run emulator for region');
		}
	});
});

describe('PATCH', () => {
	it('should save region form state and invalidate strategy', async () => {
		vi.spyOn(regionModule, 'invalidateStrategyForProject').mockImplementation(() => {});
		vi.spyOn(regionModule, 'saveRegionFormState').mockImplementation(() => Promise.resolve());
		const request = new Request(new URL('http://localhost:3000'), {
			method: 'PATCH',
			body: JSON.stringify({ formValues: MOCK_FORM_VALUES })
		});
		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };

		const response = await (PATCH as any)({ request, locals, params } as any);

		expect(response.status).toBe(204);
		expect(regionModule.invalidateStrategyForProject).toHaveBeenCalledWith(locals.userState, params.project);
		expect(regionModule.saveRegionFormState).toHaveBeenCalledWith(
			locals.userState,
			params.project,
			params.region,
			MOCK_FORM_VALUES
		);
	});
});
