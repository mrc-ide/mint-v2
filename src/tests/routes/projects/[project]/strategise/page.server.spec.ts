import * as regionModule from '$lib/server/region';
import { actions, load } from '$routes/projects/[project]/strategise/+page.server';
import * as utilsModule from '$routes/projects/[project]/strategise/utils';
import * as superValidate from 'sveltekit-superforms';

beforeEach(() => {
	vi.resetAllMocks();
});
describe('load', () => {
	it('should correctly load page data', async () => {
		const projectData = {
			name: 'test-project',
			regions: [
				{
					name: 'Region 1',
					cases: [],
					formValues: {}
				}
			]
		};
		const regionalStrategies = [
			{
				region: 'Region 1',
				interventions: [
					{ intervention: 'intervention_1', casesAverted: 100, cost: 500 },
					{ intervention: 'intervention_2', casesAverted: 150, cost: 800 }
				]
			}
		];
		const maxCost = 839.34323;
		const minimumCost = 123.123;
		vi.spyOn(regionModule, 'getProjectFromUserState').mockReturnValue(projectData as any);
		vi.spyOn(utilsModule, 'getCasesAvertedAndCostsForStrategise').mockReturnValue(regionalStrategies as any);
		vi.spyOn(utilsModule, 'getMaximumCostForStrategise').mockReturnValue(maxCost);
		vi.spyOn(utilsModule, 'getMinimumCostForStrategise').mockReturnValue(minimumCost);

		const params = { project: 'test-project' };
		const locals = {
			userState: {
				projects: [projectData]
			}
		};

		const result = await (load({ params, locals } as any) as any);

		expect(result.project.name).toBe('test-project');
		expect(result.regionalStrategies).toBe(regionalStrategies);
		expect(result.form.data.minCost).toBe(minimumCost);
		expect(result.form.data.maxCost).toBe(Math.ceil(maxCost));
		expect(result.form.data.budget).toBe(Math.ceil(maxCost));
	});
});

describe('actions', () => {
	it('should save strategy on form submission', async () => {
		const locals = {
			userState: {
				projects: [
					{
						name: 'test-project',
						strategy: null
					}
				]
			}
		};
		const params = { project: 'test-project' };
		const mockForm = {
			valid: true,
			data: {
				budget: 1000,
				minCost: 100,
				maxCost: 2000,
				strategiseResults: [{ costThreshold: 500, interventions: [] }]
			}
		} as any;
		vi.spyOn(superValidate, 'superValidate').mockResolvedValueOnce(mockForm);
		const result = (await actions.default({ request: {}, locals, params } as any)) as any;

		expect(locals.userState.projects[0].strategy).toEqual({
			budget: mockForm.data.budget,
			results: mockForm.data.strategiseResults
		});
		expect(result.form).toBe(mockForm);
	});
});
