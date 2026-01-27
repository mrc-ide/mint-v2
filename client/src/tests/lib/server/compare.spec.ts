import * as ApiFetch from '$lib/fetch';
import * as Urls from '$lib/url';
import { fetchCompareParameters } from '$lib/server/compare';
import { MOCK_COMPARE_PARAMETERS } from '$mocks/mocks';

describe('getCompareParameters', () => {
	vi.spyOn(Urls, 'getCompareParametersUrl').mockReturnValue('/compare-parameters');

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
