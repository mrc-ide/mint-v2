import { getCompareParameters } from '$lib/server/compare';
import { getRegionFromUserState } from '$lib/server/region';
import { load } from '$routes/projects/[project]/regions/[region]/compare/+page.server';

vi.mock('$lib/server/compare', () => ({
	getCompareParameters: vi.fn()
}));
vi.mock('$lib/server/region', () => ({
	getRegionFromUserState: vi.fn()
}));
describe('+page.server load function', () => {
	it('should load region data and compare parameters', async () => {
		const fetchMock = vi.fn();
		vi.mocked(getRegionFromUserState).mockReturnValue({ region: 'test-region' } as any);
		vi.mocked(getCompareParameters).mockResolvedValue({ some: 'compare-params' } as any);

		const params = { project: 'test-project', region: 'test-region' };
		const locals = { userState: { projects: [] } };

		const result = await load({ params, locals, fetch: fetchMock } as any);

		expect(getRegionFromUserState).toHaveBeenCalledWith(locals.userState, params.project, params.region);
		expect(getCompareParameters).toHaveBeenCalledWith(fetchMock);
		expect(result).toEqual({
			region: { region: 'test-region' },
			compareParameters: { some: 'compare-params' }
		});
	});
});
