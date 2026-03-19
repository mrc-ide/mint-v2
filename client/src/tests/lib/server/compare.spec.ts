import * as ApiFetch from '$lib/fetch';
import * as Urls from '$lib/url';
import { fetchCompareParameters, fetchLongTermResults } from '$lib/server/compare';
import { MOCK_COMPARE_PARAMETERS, MOCK_FORM_VALUES } from '$mocks/mocks';

describe('compare server functions', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	describe('fetchCompareParameters', () => {
		beforeEach(() => {
			vi.spyOn(Urls, 'getCompareParametersUrl').mockReturnValue('/compare-parameters');
			vi.spyOn(Urls, 'runEmulatorUrl').mockReturnValue('http://localhost:8000/emulator/run');
		});

		it('should fetch compare parameters successfully', async () => {
			vi.spyOn(ApiFetch, 'apiFetch').mockResolvedValue({ data: MOCK_COMPARE_PARAMETERS } as any);
			const mockFetch = vi.fn();

			const result = await fetchCompareParameters(mockFetch);

			expect(result).toEqual(MOCK_COMPARE_PARAMETERS);
			expect(ApiFetch.apiFetch).toHaveBeenCalledWith({ fetcher: mockFetch, url: '/compare-parameters' });
		});

		it('should throw error when apiFetch fails with ApiError', async () => {
			const apiError = new ApiFetch.ApiError('Network Error', 503);
			vi.spyOn(ApiFetch, 'apiFetch').mockRejectedValue(apiError);
			const mockFetch = vi.fn();

			await expect(fetchCompareParameters(mockFetch)).rejects.toMatchObject({
				status: 503,
				body: {
					message: 'Failed to fetch compare parameters'
				}
			});
		});

		it('should throw error with 500 when apiFetch fails with generic error', async () => {
			vi.spyOn(ApiFetch, 'apiFetch').mockRejectedValue(new Error('Some generic error'));
			const mockFetch = vi.fn();

			await expect(fetchCompareParameters(mockFetch)).rejects.toMatchObject({
				status: 500,
				body: {
					message: 'Failed to fetch compare parameters'
				}
			});
		});
	});

	describe('fetchLongTermResults', () => {
		beforeEach(() => {
			vi.spyOn(Urls, 'runEmulatorUrl').mockReturnValue('http://localhost:8000/emulator/run');
		});
		it('should return undefined if no longTermFormValues are provided', async () => {
			const result = await fetchLongTermResults({}, undefined, MOCK_COMPARE_PARAMETERS, vi.fn());

			expect(result).toBeUndefined();
		});

		it('should throw error if error in apiFetch', async () => {
			vi.spyOn(ApiFetch, 'apiFetch').mockRejectedValue(new ApiFetch.ApiError('API fetch failed', 404));

			await expect(
				fetchLongTermResults(MOCK_FORM_VALUES as any, MOCK_FORM_VALUES as any, MOCK_COMPARE_PARAMETERS, vi.fn())
			).rejects.toMatchObject({
				status: 404,
				body: {
					message: 'Failed to fetch long term results. Please try again later.'
				}
			});
		});

		it('should fetch long term results correctly and return them in expected format', async () => {
			const mockFullLongTerm = { result: 'full-long-term-result' };
			const mockBaselineLongTerm = { result: 'baseline-long-term-result' };
			const mockFetch = vi.fn();
			const baselineParamName = MOCK_COMPARE_PARAMETERS.baselineParameters[0].parameterName;
			const longTermFormValues = {
				...MOCK_FORM_VALUES,
				[baselineParamName]: 66
			};
			vi.spyOn(ApiFetch, 'apiFetch')
				.mockResolvedValueOnce({ data: mockFullLongTerm } as any)
				.mockResolvedValueOnce({ data: mockBaselineLongTerm } as any);

			const result = await fetchLongTermResults(
				MOCK_FORM_VALUES as any,
				longTermFormValues as any,
				MOCK_COMPARE_PARAMETERS,
				mockFetch
			);

			expect(result).toEqual({
				fullLongTerm: mockFullLongTerm,
				baselineLongTerm: mockBaselineLongTerm
			});

			expect(ApiFetch.apiFetch).toHaveBeenCalledWith({
				url: 'http://localhost:8000/emulator/run',
				fetcher: mockFetch,
				method: 'POST',
				body: longTermFormValues
			});

			expect(ApiFetch.apiFetch).toHaveBeenCalledWith({
				url: 'http://localhost:8000/emulator/run',
				fetcher: mockFetch,
				method: 'POST',
				body: {
					...MOCK_FORM_VALUES,
					[baselineParamName]: 66
				}
			});
		});
	});
});
