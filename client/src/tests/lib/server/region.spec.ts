import { ApiError, apiFetch } from '$lib/fetch';
import { saveUserState } from '$lib/server/redis';
import {
	getProjectFromUserState,
	getRegionFormSchema,
	getRegionFromUserState,
	invalidateStrategyForProject,
	saveRegionFormState,
	saveRegionRun
} from '$lib/server/region';
import type { EmulatorResults, UserState } from '$lib/types/userState';
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('$lib/fetch', () => ({
	ApiError: class ApiError extends Error {
		constructor(
			message: string,
			public status: number
		) {
			super(message);
		}
	},
	apiFetch: vi.fn()
}));

vi.mock('$lib/server/redis', () => ({
	saveUserState: vi.fn()
}));

vi.mock('$lib/url', () => ({
	regionFormUrl: vi.fn(() => '/api/region-form'),
	runEmulatorUrl: vi.fn(() => '/api/run-emulator')
}));

describe('getRegionFormSchema', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should fetch and return form schema successfully', async () => {
		const mockSchema = {
			fields: [{ name: 'population', type: 'number', label: 'Population' }]
		};

		vi.mocked(apiFetch).mockResolvedValue({ data: mockSchema } as any);

		const result = await getRegionFormSchema('Project A', 'Region 1', mockFetch);

		expect(result).toEqual(mockSchema);
		expect(apiFetch).toHaveBeenCalledWith({
			url: '/api/region-form',
			fetcher: mockFetch
		});
	});

	it('should throw error with status code from ApiError', async () => {
		(apiFetch as Mock).mockRejectedValue(new ApiError('Not found', 404));

		await expect(getRegionFormSchema('Project A', 'Region 1', mockFetch)).rejects.toThrow(
			expect.objectContaining({ status: 404 })
		);
	});

	it('should throw 500 error for non-ApiError exceptions', async () => {
		(apiFetch as Mock).mockRejectedValue(new Error('Network error'));

		await expect(getRegionFormSchema('Project A', 'Region 1', mockFetch)).rejects.toThrow(
			expect.objectContaining({ status: 500 })
		);
	});
});

describe('saveRegionRun', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should save region run data to user state', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [
						{
							name: 'Region 1',
							hasRunBaseline: false,
							formValues: {}
						}
					]
				}
			]
		};

		const formValues = { population: '10000' };
		const emulatorResults: EmulatorResults = {
			eirValid: true,
			cases: [{ year: 1, scenario: 'no_intervention', casesPer1000: 150 }],
			prevalence: [{ days: 14, scenario: 'no_intervention', prevalence: 0.24 }]
		};

		vi.mocked(saveUserState).mockResolvedValue(undefined);

		await saveRegionRun(userState, 'Project A', 'Region 1', formValues, emulatorResults);

		const region = userState.projects[0].regions[0];
		expect(region.formValues).toEqual(formValues);
		expect(region.results).toEqual(emulatorResults);
		expect(region.hasRunBaseline).toBe(true);
		expect(saveUserState).toHaveBeenCalledWith(userState);
	});

	it('should throw 404 when project not found', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		await expect(saveRegionRun(userState, 'Nonexistent', 'Region 1', {}, {} as EmulatorResults)).rejects.toThrow();
	});

	it('should throw 404 when region not found', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: []
				}
			]
		};

		await expect(saveRegionRun(userState, 'Project A', 'Nonexistent', {}, {} as EmulatorResults)).rejects.toThrow();
	});

	it('should update existing data when region already has baseline', async () => {
		const oldFormValues = { population: '5000' };
		const oldResults: EmulatorResults = {
			eirValid: true,
			cases: [{ year: 1, scenario: 'no_intervention', casesPer1000: 150 }],
			prevalence: [{ days: 14, scenario: 'no_intervention', prevalence: 0.24 }]
		};

		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [
						{
							name: 'Region 1',
							hasRunBaseline: true,
							formValues: oldFormValues,
							results: oldResults
						}
					]
				}
			]
		};

		const newFormValues = { population: '10000' };
		const newResults: EmulatorResults = {
			...oldResults,
			eirValid: false
		};

		vi.mocked(saveUserState).mockResolvedValue(undefined);

		await saveRegionRun(userState, 'Project A', 'Region 1', newFormValues, newResults);

		const region = userState.projects[0].regions[0];
		expect(region.formValues).toEqual(newFormValues);
		expect(region.results).toEqual(newResults);
	});
});

describe('saveRegionFormState', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should save form values to region', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [
						{
							name: 'Region 1',
							hasRunBaseline: false,
							formValues: {}
						}
					]
				}
			]
		};

		const formValues = { population: '10000', baseline_prevalence: '0.15' };

		vi.mocked(saveUserState).mockResolvedValue(undefined);

		await saveRegionFormState(userState, 'Project A', 'Region 1', formValues);

		const region = userState.projects[0].regions[0];
		expect(region.formValues).toEqual(formValues);
		expect(saveUserState).toHaveBeenCalledWith(userState);
	});

	it('should not modify hasRunBaseline or results', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [
						{
							name: 'Region 1',
							hasRunBaseline: true,
							formValues: {}
						}
					]
				}
			]
		};

		const formValues = { population: '20000' };

		(saveUserState as Mock).mockResolvedValue(undefined);

		await saveRegionFormState(userState, 'Project A', 'Region 1', formValues);

		const region = userState.projects[0].regions[0];
		expect(region.hasRunBaseline).toBe(true);
		expect(region.results).toBeUndefined();
	});

	it('should throw 404 when project not found', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		await expect(saveRegionFormState(userState, 'Nonexistent', 'Region 1', {})).rejects.toThrow();
	});

	it('should throw 404 when region not found', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: []
				}
			]
		};

		await expect(saveRegionFormState(userState, 'Project A', 'Nonexistent', {})).rejects.toThrow();
	});
});

describe('getRegionFromUserState', () => {
	it('should return region when found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [
						{
							name: 'Region 1',
							hasRunBaseline: false,
							formValues: {}
						}
					]
				}
			]
		};

		const result = getRegionFromUserState(userState, 'Project A', 'Region 1');

		expect(result).toEqual(userState.projects[0].regions[0]);
	});

	it('should throw 404 when project not found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		expect(() => getRegionFromUserState(userState, 'Nonexistent', 'Region 1')).toThrow();
	});

	it('should throw 404 when region not found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: []
				}
			]
		};

		expect(() => getRegionFromUserState(userState, 'Project A', 'Nonexistent')).toThrow();
	});

	it('should include project and region names in error message', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Test Project',
					regions: []
				}
			]
		};

		try {
			getRegionFromUserState(userState, 'Test Project', 'Test Region');
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.body?.message).toContain('Test Project');
			expect(err.body?.message).toContain('Test Region');
		}
	});
});

describe('getProjectFromUserState', () => {
	it('should return project when found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: []
				}
			]
		};

		const result = getProjectFromUserState(userState, 'Project A');

		expect(result).toEqual(userState.projects[0]);
	});

	it('should throw 404 when project not found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		expect(() => getProjectFromUserState(userState, 'Nonexistent')).toThrow();
	});

	it('should include project name in error message', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		try {
			getProjectFromUserState(userState, 'Test Project');
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.body?.message).toContain('Test Project');
		}
	});
});

describe('invalidateStrategyForProject', () => {
	it('should set strategy to undefined', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [],
					strategy: { budget: 1000, results: [] }
				}
			]
		};

		invalidateStrategyForProject(userState, 'Project A');

		expect(userState.projects[0].strategy).toBeUndefined();
	});

	it('should work when strategy is already undefined', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: [
				{
					name: 'Project A',
					regions: [],
					strategy: undefined
				}
			]
		};

		invalidateStrategyForProject(userState, 'Project A');

		expect(userState.projects[0].strategy).toBeUndefined();
	});

	it('should throw 404 when project not found', () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		expect(() => invalidateStrategyForProject(userState, 'Nonexistent')).toThrow();
	});
});
