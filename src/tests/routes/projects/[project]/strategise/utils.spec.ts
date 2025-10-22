import * as numberModule from '$lib/number';
import * as costsModule from '$lib/process-results/costs';
import type { CasesAverted } from '$lib/process-results/processCases';
import * as processCasesModule from '$lib/process-results/processCases';
import type { Region, Scenario, StrategiseResult } from '$lib/types/userState';
import type { StrategiseRegions } from '$routes/projects/[project]/strategise/schema';
import {
	buildInterventions,
	constructRegionalMetrics,
	getCasesAvertedAndCostsForStrategise,
	getMaximumCostForStrategise,
	getMinimumCostForStrategise,
	processRegionData,
	strategise,
	strategiseAsync
} from '$routes/projects/[project]/strategise/utils';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('getMinimumCostForStrategise', () => {
	it('should return the minimum cost across all interventions', () => {
		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [
					{ intervention: 'irs_only', cost: 100, casesAverted: 50 },
					{ intervention: 'lsm_only', cost: 200, casesAverted: 75 }
				]
			},
			{
				region: 'Region B',
				interventions: [
					{ intervention: 'irs_only', cost: 50, casesAverted: 30 },
					{ intervention: 'lsm_only', cost: 150, casesAverted: 60 }
				]
			}
		];

		expect(getMinimumCostForStrategise(regions)).toBe(50);
	});

	it('should handle single region with single intervention', () => {
		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only', cost: 100, casesAverted: 50 }]
			}
		];

		expect(getMinimumCostForStrategise(regions)).toBe(100);
	});
});

describe('getMaximumCostForStrategise', () => {
	it('should return sum of maximum costs from each region', () => {
		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [
					{ intervention: 'irs_only', cost: 100, casesAverted: 50 },
					{ intervention: 'lsm_only', cost: 200, casesAverted: 75 }
				]
			},
			{
				region: 'Region B',
				interventions: [
					{ intervention: 'irs_only', cost: 50, casesAverted: 30 },
					{ intervention: 'lsm_only', cost: 150, casesAverted: 60 }
				]
			}
		];

		expect(getMaximumCostForStrategise(regions)).toBe(350); // 200 + 150
	});

	it('should handle empty interventions array', () => {
		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: []
			}
		];

		expect(getMaximumCostForStrategise(regions)).toBe(-Infinity);
	});
});

describe('cases averted and costs for strategise', () => {
	describe('buildInterventions', () => {
		it('should build interventions correctly', () => {
			const casesAvertedData = {
				lsm_only: { totalAvertedCasesPer1000: 20 },
				irs_only: { totalAvertedCasesPer1000: 15 }
			} as Partial<Record<Scenario, CasesAverted>>;
			const regionForm = { population: 10000 };
			const costSpy = vi
				.spyOn(costsModule, 'getTotalCostsPerScenario')
				.mockReturnValue({ lsm_only: 200, irs_only: 150 });
			const combineSpy = vi.spyOn(costsModule, 'combineCostsAndCasesAverted').mockReturnValue({
				lsm_only: { totalCost: 200, casesAverted: casesAvertedData.lsm_only! },
				irs_only: { totalCost: 150, casesAverted: casesAvertedData.irs_only! }
			});

			const interventions = buildInterventions(casesAvertedData, regionForm);

			expect(interventions).toEqual([
				{ intervention: 'lsm_only', cost: 200, casesAverted: 200 },
				{ intervention: 'irs_only', cost: 150, casesAverted: 150 }
			]);
			expect(costSpy).toHaveBeenCalledWith(['lsm_only', 'irs_only'], regionForm);
			expect(combineSpy).toHaveBeenCalled();
		});
	});

	describe('processRegionData', () => {
		it('should return null for region with no cases averted data', () => {
			const region = {
				name: 'Region A',
				cases: [],
				formValues: {}
			} as unknown as Region;

			const result = processRegionData(region);

			expect(result).toBeNull();
		});

		it('should process region data correctly', () => {
			const casesAvertedData = {
				lsm_only: { totalAvertedCasesPer1000: 20 },
				irs_only: { totalAvertedCasesPer1000: 15 }
			} as Partial<Record<Scenario, CasesAverted>>;
			vi.spyOn(costsModule, 'getTotalCostsPerScenario').mockReturnValue({ lsm_only: 200, irs_only: 150 });
			vi.spyOn(costsModule, 'combineCostsAndCasesAverted').mockReturnValue({
				lsm_only: { totalCost: 200, casesAverted: casesAvertedData.lsm_only! },
				irs_only: { totalCost: 150, casesAverted: casesAvertedData.irs_only! }
			});
			vi.spyOn(processCasesModule, 'collectPostInterventionCases').mockReturnValue({} as any);
			vi.spyOn(processCasesModule, 'getAvertedCasesData').mockReturnValue(casesAvertedData);

			const region = {
				name: 'Region A',
				cases: [],
				formValues: { population: 10000 }
			} as unknown as Region;

			const regionData = processRegionData(region);

			expect(regionData).toEqual({
				region: 'Region A',
				interventions: [
					{ intervention: 'lsm_only', cost: 200, casesAverted: 200 },
					{ intervention: 'irs_only', cost: 150, casesAverted: 150 }
				]
			});
		});
	});

	it('should process regions with valid cases data', () => {
		const mockCasesAverted = {
			scenario1: { totalAvertedCasesPer1000: 10 }
		};

		vi.spyOn(processCasesModule, 'collectPostInterventionCases').mockReturnValue({} as any);
		vi.spyOn(processCasesModule, 'getAvertedCasesData').mockReturnValue(mockCasesAverted as any);
		vi.spyOn(costsModule, 'getTotalCostsPerScenario').mockReturnValue({ scenario1: 1000 } as any);
		vi.spyOn(costsModule, 'combineCostsAndCasesAverted').mockReturnValue({
			scenario1: { totalCost: 1000, casesAverted: mockCasesAverted.scenario1 }
		} as any);
		vi.spyOn(processCasesModule, 'convertPer1000ToTotal').mockReturnValue(100);

		const regions = [
			{
				name: 'Region A',
				cases: [],
				formValues: { population: 10000 }
			}
		] as unknown as Region[];

		const result = getCasesAvertedAndCostsForStrategise(regions);

		expect(result).toHaveLength(1);
		expect(result[0].region).toBe('Region A');
		expect(result[0].interventions).toHaveLength(1);
	});

	it('should filter out regions with no cases averted data', () => {
		vi.spyOn(processCasesModule, 'collectPostInterventionCases').mockReturnValue([] as any);
		vi.spyOn(processCasesModule, 'getAvertedCasesData').mockReturnValue({});

		const regions = [
			{
				name: 'Region A',
				cases: [],
				formValues: {}
			}
		] as unknown as Region[];

		const result = getCasesAvertedAndCostsForStrategise(regions);

		expect(result).toHaveLength(0);
	});
});

describe('strategise', () => {
	it('should generate strategies per region for cost range', () => {
		const costThresholds = [50, 100, 300, 400];
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue(costThresholds);

		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [
					{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 },
					{ intervention: 'lsm_only' as Scenario, cost: 200, casesAverted: 100 }
				]
			},
			{
				region: 'Region B',
				interventions: [
					{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 },
					{ intervention: 'lsm_only' as Scenario, cost: 200, casesAverted: 100 }
				]
			}
		];

		const result = strategise(100, 300, regions);

		expect(result).toHaveLength(costThresholds.length);
		costThresholds.forEach((threshold, index) => {
			expect(result[index].costThreshold).toBe(threshold);
			const uniqueRegions = new Set(result[index].interventions.map((intervention) => intervention.region));
			expect(uniqueRegions.size).toBe(regions.length);
		});
		// check lowest cost and highest cost scenarios
		expect(result[0].interventions.every((i) => i.intervention === 'no_intervention')).toBe(true);
		expect(result[costThresholds.length - 1].interventions.every((i) => i.intervention === 'lsm_only')).toBe(true);
	});

	it('should include no_intervention option for each region', () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([0]);

		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only' as Scenario, cost: 1000, casesAverted: 50 }]
			}
		];

		const result = strategise(0, 0, regions);
		expect(result).toHaveLength(1);
		expect(result[0].interventions[0].intervention).toBe('no_intervention');
	});
});

describe('strategiseAsync', () => {
	it('should resolve with strategise results asynchronously', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([100]);

		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 }]
			}
		];

		const result = await strategiseAsync(100, 100, regions);

		expect(result).toHaveLength(1);
		expect(result[0].costThreshold).toBe(100);
	});

	it('should not block main thread', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([100]);

		const regions: StrategiseRegions = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 }]
			}
		];

		const promise = strategiseAsync(100, 100, regions);
		expect(promise).toBeInstanceOf(Promise);
		await promise;
	});
});

describe('constructRegionalMetrics', () => {
	it('should construct regional metrics correctly', () => {
		const strategy = {
			costThreshold: 500,
			interventions: [
				{ region: 'Region A', intervention: 'irs_only', cost: 200, casesAverted: 50 },
				{ region: 'Region B', intervention: 'lsm_only', cost: 300, casesAverted: 75 }
			]
		} as StrategiseResult;
		const populations = {
			'Region A': 1000,
			'Region B': 2000
		};

		const metrics = constructRegionalMetrics(strategy, populations);

		expect(metrics).toEqual({
			'Region A': {
				costPerPerson: 0.2,
				costPerCaseAverted: 4,
				casesAvertedPerPerson: 0.05,
				casesAverted: 50,
				cost: 200,
				population: 1000,
				intervention: 'irs_only',
				region: 'Region A'
			},
			'Region B': {
				costPerPerson: 0.15,
				costPerCaseAverted: 4,
				casesAvertedPerPerson: 0.0375,
				casesAverted: 75,
				cost: 300,
				population: 2000,
				intervention: 'lsm_only',
				region: 'Region B'
			}
		});
	});

	it('should handle zero population gracefully', () => {
		const strategy = {
			costThreshold: 500,
			interventions: [{ region: 'Region A', intervention: 'irs_only', cost: 200, casesAverted: 50 }]
		} as StrategiseResult;
		const populations = {
			'Region A': 0
		};

		const metrics = constructRegionalMetrics(strategy, populations);

		expect(metrics['Region A'].costPerPerson).toBe(0);
		expect(metrics['Region A'].costPerCaseAverted).toBe(4);
		expect(metrics['Region A'].casesAvertedPerPerson).toBe(0);
	});
});
