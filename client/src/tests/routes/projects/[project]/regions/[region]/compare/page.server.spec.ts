import { fetchCompareParameters, fetchLongTermResults } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import { load } from '$routes/projects/[project]/regions/[region]/compare/+page.server';

vi.mock('$lib/server/compare', () => ({
	fetchCompareParameters: vi.fn(),
	fetchLongTermResults: vi.fn()
}));
vi.mock('$lib/server/region', () => ({
	getRegionFromUserState: vi.fn()
}));
describe('+page.server load function', () => {
	it('should load region data and compare parameters & stream longTermResults', async () => {
		const fetchMock = vi.fn();
		const mockRegion = { region: 'test-region', formValues: { prev: 1 }, longTermFormValues: { prev: 2 } };
		vi.mocked(getRegionFromUserState).mockReturnValue(mockRegion as any);
		vi.mocked(fetchCompareParameters).mockResolvedValue({ some: 'compare-params' } as any);
		vi.mocked(fetchLongTermResults).mockResolvedValue({ some: 'long-term-results' } as any);

		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };

		const result = (await load({ params, locals, fetch: fetchMock } as any)) as any;

		expect(getRegionFromUserState).toHaveBeenCalledWith(locals.userState, params.project, params.region);
		expect(fetchCompareParameters).toHaveBeenCalledWith(fetchMock);
		expect(fetchLongTermResults).toHaveBeenCalledWith(
			mockRegion.formValues,
			mockRegion.longTermFormValues,
			{ some: 'compare-params' },
			fetchMock
		);
		expect(result.region).toEqual(mockRegion);
		expect(result.compareParameters).toEqual({ some: 'compare-params' });
		expect(result.longTermResults).toBeInstanceOf(Promise);
		expect(await result.longTermResults).toEqual({ some: 'long-term-results' });
	});
});
