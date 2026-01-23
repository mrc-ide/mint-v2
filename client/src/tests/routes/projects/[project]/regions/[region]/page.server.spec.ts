import * as regionModule from '$lib/server/region';
import { load } from '$routes/projects/[project]/regions/[region]/+page.server';

describe('load', () => {
	it('should load region data and form schema', async () => {
		const fetchMock = vi.fn();
		const locals = { userState: { projects: [] } };
		const params = { project: 'test-project', region: 'test-region' };
		const regionData = { region: 'test-region', cases: [] } as any;
		const formSchema = { some: 'schema' } as any;

		vi.spyOn(regionModule, 'getRegionFromUserState').mockReturnValue(regionData);
		vi.spyOn(regionModule, 'getRegionFormSchema').mockResolvedValue(formSchema);

		const result = await load({ params, locals, fetch: fetchMock } as any);

		expect(regionModule.getRegionFromUserState).toHaveBeenCalledWith(locals.userState, params.project, params.region);
		expect(regionModule.getRegionFormSchema).toHaveBeenCalledWith(params.project, params.region, fetchMock);
		expect(result).toEqual({
			formSchema: formSchema,
			region: regionData,
			addRegionForm: expect.any(Object)
		});
	});
});
