import * as ApiFetch from '$lib/fetch';
import * as Urls from '$lib/url';
import { fetchCompareParameters, getCompareParametersWithValue } from '$lib/server/compare';
import { MOCK_COMPARE_PARAMETERS } from '$mocks/mocks';
import type { CompareParameters } from '$lib/types/compare';

describe('fetchCompareParameters', () => {
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

describe('getCompareParametersWithValue', () => {
	it('should transform compare parameters with valid form values', () => {
		const compareParameters: CompareParameters = {
			baselineParameters: [
				{ parameterName: 'param1', label: 'Parameter 1', min: 0, max: 100 },
				{ parameterName: 'param2', label: 'Parameter 2', min: 0, max: 100 }
			],
			interventionParameters: [{ parameterName: 'param3', label: 'Parameter 3', min: 0, max: 100 }]
		};

		const formValues = {
			param1: 50,
			param2: 75,
			param3: 25
		};

		const result = getCompareParametersWithValue(compareParameters, formValues);

		expect(result.baselineParameters).toEqual([
			{ parameterName: 'param1', label: 'Parameter 1', min: 0, max: 100, value: 50 },
			{ parameterName: 'param2', label: 'Parameter 2', min: 0, max: 100, value: 75 }
		]);
		expect(result.interventionParameters).toEqual([
			{ parameterName: 'param3', label: 'Parameter 3', min: 0, max: 100, value: 25 }
		]);
	});

	it('should throw error when parameter value is missing', () => {
		const compareParameters: CompareParameters = {
			baselineParameters: [{ parameterName: 'param1', label: 'Parameter 1', min: 0, max: 100 }],
			interventionParameters: []
		};

		const formValues = {};

		expect(() => getCompareParametersWithValue(compareParameters, formValues)).toThrow(
			'Value for parameter "param1" is missing or not a number.'
		);
	});

	it('should throw error when parameter value is not a number', () => {
		const compareParameters: CompareParameters = {
			baselineParameters: [],
			interventionParameters: [{ parameterName: 'param1', label: 'Parameter 1', min: 0, max: 100 }]
		};

		const formValues = {
			param1: 'not a number'
		};

		expect(() => getCompareParametersWithValue(compareParameters, formValues)).toThrow(
			'Value for parameter "param1" is missing or not a number.'
		);
	});
});
