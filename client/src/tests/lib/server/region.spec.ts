import { ApiError, apiFetch } from '$lib/fetch';
import { saveUserState } from '$lib/server/redis';
import {
	getProjectFromUserState,
	getRegionFormSchema,
	getRegionFromUserState,
	invalidateStrategyForProject,
	runEmulatorOnLoad,
	saveRegionFormState,
	saveRegionRun
} from '$lib/server/region';
import type { CasesData, EmulatorResults, Region, UserState } from '$lib/types/userState';
import type { RequestEvent } from '@sveltejs/kit';
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

describe('runEmulatorOnLoad', () => {
	const mockFetch = vi.fn() as unknown as RequestEvent['fetch'];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return null when hasRunBaseline is false', async () => {
		const regionData: Region = {
			name: 'Region 1',
			hasRunBaseline: false,
			formValues: {},
			cases: [],
			prevalence: []
		};

		const result = await runEmulatorOnLoad(regionData, mockFetch);

		expect(result).toBeNull();
		expect(apiFetch).not.toHaveBeenCalled();
	});

	it('should fetch and return emulator results when hasRunBaseline is true', async () => {
		const mockResults: EmulatorResults = {
			cases: [{ year: 1, scenario: 'no_intervention', casesPer1000: 100 }],
			prevalence: [],
			eirValid: true
		};

		const regionData: Region = {
			name: 'Region 1',
			hasRunBaseline: true,
			formValues: { population: '10000' },
			cases: [],
			prevalence: []
		};

		(apiFetch as Mock).mockResolvedValue({ data: mockResults });

		const result = await runEmulatorOnLoad(regionData, mockFetch);

		expect(result).toEqual(mockResults);
		expect(apiFetch).toHaveBeenCalledWith({
			url: '/api/run-emulator',
			method: 'POST',
			body: regionData.formValues,
			fetcher: mockFetch
		});
	});

	it('should return null and log error when API call fails', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const regionData: Region = {
			name: 'Region 1',
			hasRunBaseline: true,
			formValues: { population: '10000' },
			cases: [],
			prevalence: []
		};

		(apiFetch as Mock).mockRejectedValue(new Error('API Error'));

		const result = await runEmulatorOnLoad(regionData, mockFetch);

		expect(result).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

		consoleErrorSpy.mockRestore();
	});

	it('should pass formValues as request body', async () => {
		const formValues = {
			population: '50000',
			baseline_prevalence: '0.15'
		};

		const regionData: Region = {
			name: 'Region 1',
			hasRunBaseline: true,
			formValues,
			cases: [],
			prevalence: []
		};

		(apiFetch as Mock).mockResolvedValue({ data: { cases: [], prevalence: [] } });

		await runEmulatorOnLoad(regionData, mockFetch);

		expect(apiFetch).toHaveBeenCalledWith({
			url: '/api/run-emulator',
			method: 'POST',
			body: formValues,
			fetcher: mockFetch
		});
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
							formValues: {},
							cases: [],
							prevalence: []
						}
					]
				}
			]
		};

		const formValues = { population: '10000' };
		const cases: CasesData[] = [{ year: 1, scenario: 'no_intervention', casesPer1000: 100 }];

		vi.mocked(saveUserState).mockResolvedValue(undefined);

		await saveRegionRun(userState, 'Project A', 'Region 1', formValues, cases);

		const region = userState.projects[0].regions[0];
		expect(region.formValues).toEqual(formValues);
		expect(region.cases).toEqual(cases);
		expect(region.hasRunBaseline).toBe(true);
		expect(saveUserState).toHaveBeenCalledWith(userState);
	});

	it('should throw 404 when project not found', async () => {
		const userState: UserState = {
			userId: 'user-1',
			createdAt: '2024-01-01T00:00:00.000Z',
			projects: []
		};

		await expect(saveRegionRun(userState, 'Nonexistent', 'Region 1', {}, [])).rejects.toThrow();
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

		await expect(saveRegionRun(userState, 'Project A', 'Nonexistent', {}, [])).rejects.toThrow();
	});

	it('should update existing data when region already has baseline', async () => {
		const oldFormValues = { population: '5000' };
		const oldCases: CasesData[] = [{ year: 1, scenario: 'no_intervention', casesPer1000: 200 }];

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
							cases: oldCases,
							prevalence: []
						}
					]
				}
			]
		};

		const newFormValues = { population: '10000' };
		const newCases: CasesData[] = [{ year: 1, scenario: 'no_intervention', casesPer1000: 100 }];

		vi.mocked(saveUserState).mockResolvedValue(undefined);

		await saveRegionRun(userState, 'Project A', 'Region 1', newFormValues, newCases);

		const region = userState.projects[0].regions[0];
		expect(region.formValues).toEqual(newFormValues);
		expect(region.cases).toEqual(newCases);
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
							formValues: {},
							cases: [],
							prevalence: []
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

	it('should not modify hasRunBaseline or cases', async () => {
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
							formValues: {},
							cases: [{ year: 1, scenario: 'no_intervention', casesPer1000: 100 }],
							prevalence: []
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
		expect(region.cases).toHaveLength(1);
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
							formValues: {},
							cases: [],
							prevalence: []
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
