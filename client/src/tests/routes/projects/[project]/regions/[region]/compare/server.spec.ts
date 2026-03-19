import * as urlModule from '$lib/url';
import { MOCK_FORM_VALUES } from '$mocks/mocks';
import { server } from '$mocks/server';
import { POST, PATCH } from '$routes/projects/[project]/regions/[region]/compare/+server';
import { isHttpError, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import * as regionModule from '$lib/server/region';
import type { UserState } from '$lib/types/userState';
import * as compareModule from '$lib/server/compare';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('POST', () => {
	const mockUrl = 'http://localhost:8080/emulator/run';
	const params = { project: 'test-project', region: 'test-region' };
	const locals = { userState: {} } as any;

	it('should run emulator for comparing region and return results', async () => {
		const expectedResponse = {
			fullLongTerm: { cases: [], prevalence: [] },
			baselineLongTerm: { cases: [], prevalence: [] }
		} as any;
		const runEmulatorsForCompareSpy = vi
			.spyOn(compareModule, 'runEmulatorsForCompare')
			.mockResolvedValue(expectedResponse);
		const invalidateStrategyForProjectSpy = vi
			.spyOn(regionModule, 'invalidateStrategyForProject')
			.mockReturnValue(undefined);
		const saveLongTermRegionCompareSpy = vi
			.spyOn(regionModule, 'saveLongTermRegionCompare')
			.mockResolvedValue(undefined);
		const mockFetch = vi.fn();

		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ fullLongTermFormValues: MOCK_FORM_VALUES, baselineLongTermFormValues: MOCK_FORM_VALUES })
		});
		const response = POST({ request, fetch: mockFetch, params, locals } as any);

		const json = await (await response).json();
		expect(json).toEqual({ data: expectedResponse });
		expect(runEmulatorsForCompareSpy).toHaveBeenCalledWith(MOCK_FORM_VALUES, MOCK_FORM_VALUES, mockFetch);
		expect(invalidateStrategyForProjectSpy).toHaveBeenCalledWith(expect.anything(), 'test-project');
		expect(saveLongTermRegionCompareSpy).toHaveBeenCalledWith(
			locals.userState,
			'test-project',
			'test-region',
			MOCK_FORM_VALUES,
			expectedResponse.fullLongTerm.cases
		);
	});

	it('should throw error on runEmulatorsForCompare failure', async () => {
		vi.spyOn(urlModule, 'runEmulatorUrl').mockReturnValue(mockUrl);
		const request = new Request(new URL(mockUrl), {
			method: 'POST',
			body: JSON.stringify({ fullLongTermFormValues: MOCK_FORM_VALUES, baselineLongTermFormValues: MOCK_FORM_VALUES })
		});

		try {
			await POST({ request, fetch: vi.fn(), params, locals } as any);
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
