import { fetchCompareParameters, getCompareParametersWithValue } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import { load } from '$routes/projects/[project]/regions/[region]/compare/+page.server';

vi.mock('$lib/server/compare', () => ({
	fetchCompareParameters: vi.fn(),
	getCompareParametersWithValue: vi.fn()
}));
vi.mock('$lib/server/region', () => ({
	getRegionFromUserState: vi.fn()
}));
describe('+page.server load function', () => {
	it('should load region data and compare parameters', async () => {
		const fetchMock = vi.fn();
		const mockRegion = { region: 'test-region', formValues: { prev: 1 } };
		vi.mocked(getRegionFromUserState).mockReturnValue(mockRegion as any);
		vi.mocked(fetchCompareParameters).mockResolvedValue({ some: 'compare-params' } as any);
		vi.mocked(getCompareParametersWithValue).mockReturnValue({ some: 'compare-params-with-value' } as any);

		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };

		const result = await load({ params, locals, fetch: fetchMock } as any);

		expect(getRegionFromUserState).toHaveBeenCalledWith(locals.userState, params.project, params.region);
		expect(fetchCompareParameters).toHaveBeenCalledWith(fetchMock);
		expect(result).toEqual({
			region: mockRegion,
			compareParameters: { some: 'compare-params-with-value' }
		});
		expect(getCompareParametersWithValue).toHaveBeenCalledWith({ some: 'compare-params' }, mockRegion.formValues);
	});
});
