import { runCompareEmulator } from '$routes/projects/[project]/regions/[region]/compare/utils';
import { regionCompareUrl } from '$lib/url';
import { apiFetch } from '$lib/fetch';

vi.mock(import('$lib/fetch'), async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		apiFetch: vi.fn()
	};
});
vi.mock(import('$lib/url'), async () => ({
	regionCompareUrl: vi.fn()
}));

describe('utils', () => {
	describe('runCompareEmulator', () => {
		const mockRegionCompareUrl = 'http://test-emulator-url';
		const mockProject = 'test-project';
		const mockRegion = 'test-region';
		const mockLongTermFormValues: Record<string, any> = { param1: 'value1' };
		const mockPresentFormValues = { param2: 'value2' };
		const mockSelectedBaselineParameter = { parameterName: 'param1' };

		it('should call apiFetch with correct parameters and return results', async () => {
			const mockFullLongTermResData = { result: 'full-long-term-result' };
			const mockBaselineLongTermResData = { result: 'baseline-long-term-result' };
			vi.mocked(regionCompareUrl).mockReturnValue(mockRegionCompareUrl);
			vi.mocked(apiFetch).mockResolvedValueOnce({ data: mockFullLongTermResData });
			vi.mocked(apiFetch).mockResolvedValueOnce({ data: mockBaselineLongTermResData });

			const result = await runCompareEmulator(
				mockProject,
				mockRegion,
				mockLongTermFormValues,
				mockPresentFormValues,
				mockSelectedBaselineParameter
			);

			expect(apiFetch).toHaveBeenCalledWith({
				url: mockRegionCompareUrl,
				method: 'POST',
				body: {
					formValues: mockLongTermFormValues
				}
			});
			expect(apiFetch).toHaveBeenCalledWith({
				url: mockRegionCompareUrl,
				method: 'POST',
				body: {
					formValues: {
						...mockPresentFormValues,
						[mockSelectedBaselineParameter.parameterName]:
							mockLongTermFormValues[mockSelectedBaselineParameter.parameterName]
					}
				}
			});
			expect(result).toEqual({
				fullLongTermResData: mockFullLongTermResData,
				baselineLongTermResData: mockBaselineLongTermResData
			});
		});

		it('should throw an error if apiFetch fails', async () => {
			const mockError = new Error('API fetch failed');

			vi.mocked(regionCompareUrl).mockReturnValue('http://test-emulator-url');
			vi.mocked(apiFetch).mockRejectedValue(mockError);

			await expect(
				runCompareEmulator(
					mockProject,
					mockRegion,
					mockLongTermFormValues,
					mockPresentFormValues,
					mockSelectedBaselineParameter
				)
			).rejects.toThrow(new Error('API fetch failed'));
		});
	});
});
