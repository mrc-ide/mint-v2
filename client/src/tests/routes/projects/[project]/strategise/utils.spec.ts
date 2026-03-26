import * as numberModule from '$lib/number';
import * as costsModule from '$lib/process-results/costs';
import type { CasesAverted } from '$lib/process-results/processCases';
import * as processCasesModule from '$lib/process-results/processCases';
import type { Region, Scenario, StrategiseResult } from '$lib/types/userState';
import type { StrategiseRegionByMetric } from '$routes/projects/[project]/strategise/schema';
import {
	buildInterventions,
	constructRegionalMetrics,
	createGridRows,
	getCasesAndCostsForCompareStrategise,
	getCasesAvertedAndCostsForStrategise,
	getMaximumCostForStrategise,
	getMinimumCostForStrategise,
	optimiseForMinCases,
	parseOptimisationResult,
	processRegionData,
	strategise,
	strategiseAsync,
	strategiseCompare,
	strategiseCompareAsync
} from '$routes/projects/[project]/strategise/utils';
import { equalTo } from 'yalps';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('getMinimumCostForStrategise', () => {
	it('should return the minimum cost across all interventions', () => {
		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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
		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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
		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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
		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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

		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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

		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
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

		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 }]
			}
		];

		const result = await strategiseAsync(100, 100, regions);

		expect(result).toHaveLength(1);
		expect(result[0].costThreshold).toBe(100);
	});

	it('should call setTimeout with correct arguments', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([100]);
		vi.spyOn(global, 'setTimeout');

		const regions: StrategiseRegionByMetric<'casesAverted'>[] = [
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only' as Scenario, cost: 100, casesAverted: 50 }]
			}
		];

		await strategiseAsync(100, 100, regions);

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
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

describe('getCasesAndCostsForCompareStrategise', () => {
	it('should return null when fewer than 2 regions have both present and long-term data', () => {
		const regions = [
			{
				name: 'Region A',
				hasRunBaseline: true,
				formValues: { population: 1000 },
				results: {
					eirValid: true,
					cases: [{ scenario: 'irs_only', year: 1, casesPer1000: 10 }],
					prevalence: []
				}
			},
			{
				name: 'Region B',
				hasRunBaseline: true,
				formValues: { population: 1000 }
			}
		] as unknown as Region[];

		expect(getCasesAndCostsForCompareStrategise(regions)).toBeNull();
	});

	it('should build present and long-term compare structures for valid regions', () => {
		vi.spyOn(processCasesModule, 'getTotalCasesAndCostsPerScenario').mockImplementation(
			(cases: any, formValues: any) =>
				({
					irs_only: {
						totalCost: Number(formValues.population),
						totalCases: cases[0].casesPer1000
					}
				}) as any
		);

		const regions = [
			{
				name: 'Region A',
				hasRunBaseline: true,
				formValues: { population: 1000 },
				longTermFormValues: { population: 1100 },
				results: {
					eirValid: true,
					cases: [{ scenario: 'irs_only', year: 1, casesPer1000: 10 }],
					prevalence: []
				},
				fullLongTermCases: [{ scenario: 'irs_only', year: 2, casesPer1000: 8 }]
			},
			{
				name: 'Region B',
				hasRunBaseline: true,
				formValues: { population: 2000 },
				longTermFormValues: { population: 2100 },
				results: {
					eirValid: true,
					cases: [{ scenario: 'irs_only', year: 1, casesPer1000: 20 }],
					prevalence: []
				},
				fullLongTermCases: [{ scenario: 'irs_only', year: 2, casesPer1000: 15 }]
			},
			{
				name: 'Region C',
				hasRunBaseline: true,
				formValues: { population: 3000 },
				results: {
					eirValid: true,
					cases: [{ scenario: 'irs_only', year: 1, casesPer1000: 30 }],
					prevalence: []
				}
			}
		] as unknown as Region[];

		const result = getCasesAndCostsForCompareStrategise(regions);

		expect(result).not.toBeNull();
		expect(result?.present).toEqual([
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only', cost: 1000, cases: 10 }]
			},
			{
				region: 'Region B',
				interventions: [{ intervention: 'irs_only', cost: 2000, cases: 20 }]
			}
		]);
		expect(result?.longTerm).toEqual([
			{
				region: 'Region A',
				interventions: [{ intervention: 'irs_only', cost: 1100, cases: 8 }]
			},
			{
				region: 'Region B',
				interventions: [{ intervention: 'irs_only', cost: 2100, cases: 15 }]
			}
		]);
		expect(processCasesModule.getTotalCasesAndCostsPerScenario).toHaveBeenCalledTimes(4);
	});
});

describe('strategiseCompare', () => {
	it('should build compare strategies for both present and long-term cost ranges', () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValueOnce([0, 100]).mockReturnValueOnce([50, 150]);

		const compareRegionalStrategies = {
			present: [
				{
					region: 'Region A',
					interventions: [
						{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 100 },
						{ intervention: 'irs_only' as Scenario, cost: 50, cases: 60 }
					]
				},
				{
					region: 'Region B',
					interventions: [
						{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 80 },
						{ intervention: 'irs_only' as Scenario, cost: 50, cases: 40 }
					]
				}
			],
			longTerm: [
				{
					region: 'Region A',
					interventions: [
						{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 90 },
						{ intervention: 'irs_only' as Scenario, cost: 50, cases: 50 }
					]
				},
				{
					region: 'Region B',
					interventions: [
						{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 70 },
						{ intervention: 'irs_only' as Scenario, cost: 100, cases: 30 }
					]
				}
			]
		} as any;

		const result = strategiseCompare(0, compareRegionalStrategies);

		expect(numberModule.createLinearSpace).toHaveBeenNthCalledWith(1, 0, 100);
		expect(numberModule.createLinearSpace).toHaveBeenNthCalledWith(2, 50, 150);
		expect(result!.present.map((s) => s.costThreshold)).toEqual([0, 100]);
		expect(result!.longTerm.map((s) => s.costThreshold)).toEqual([50, 150]);
		expect(result!.present.every((s) => new Set(s.interventions.map((i) => i.region)).size === 2)).toBe(true);
		expect(result!.longTerm.every((s) => new Set(s.interventions.map((i) => i.region)).size === 2)).toBe(true);
	});
});

describe('strategiseCompareAsync', () => {
	it('should resolve with strategiseCompare results asynchronously', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([0]);

		const compareRegionalStrategies = {
			present: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'irs_only' as Scenario, cost: 0, cases: 100 }]
				}
			],
			longTerm: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'irs_only' as Scenario, cost: 0, cases: 100 }]
				}
			]
		} as any;

		const result = await strategiseCompareAsync(0, compareRegionalStrategies);

		expect(result!.present).toHaveLength(1);
		expect(result!.longTerm).toHaveLength(1);
		expect(result!.present[0].costThreshold).toBe(0);
		expect(result!.longTerm[0].costThreshold).toBe(0);
	});

	it('should return empty if only no intervention in long term', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([0]);

		const compareRegionalStrategies = {
			present: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 100 }]
				}
			],
			longTerm: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 100 }]
				}
			]
		} as any;

		const result = await strategiseCompareAsync(0, compareRegionalStrategies);

		expect(result!.present).toHaveLength(1);
		expect(result!.present[0].costThreshold).toBe(0);
		expect(result!.longTerm).toHaveLength(0);
	});

	it('should call setTimeout with correct arguments', async () => {
		vi.spyOn(numberModule, 'createLinearSpace').mockReturnValue([0]);
		vi.spyOn(global, 'setTimeout');

		const compareRegionalStrategies = {
			present: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 100 }]
				}
			],
			longTerm: [
				{
					region: 'Region A',
					interventions: [{ intervention: 'no_intervention' as Scenario, cost: 0, cases: 100 }]
				}
			]
		} as any;

		await strategiseCompareAsync(0, compareRegionalStrategies);

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
	});
});

describe('optimiseForMinCases', () => {
	it('should select interventions that minimize cases within the budget', () => {
		const model = {
			constraints: {
				'Region A': equalTo(1),
				'Region B': equalTo(1)
			},
			variables: {
				'Region A--no_intervention': { cost: 0, cases: 100, 'Region A': 1 },
				'Region A--irs_only': { cost: 50, cases: 90, 'Region A': 1 },
				'Region B--no_intervention': { cost: 0, cases: 80, 'Region B': 1 },
				'Region B--irs_only': { cost: 50, cases: 40, 'Region B': 1 }
			}
		} as any;

		const result = optimiseForMinCases(50, model);

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ region: 'Region A', intervention: 'no_intervention', cost: 0, cases: 100 });
		expect(result).toContainEqual({ region: 'Region B', intervention: 'irs_only', cost: 50, cases: 40 });
	});
});

describe('parseOptimisationResult', () => {
	it('should parse variable name and metric value correctly', () => {
		const variables = {
			'Region X--lsm_only': {
				cost: 250,
				cases: 120,
				'Region X': 1
			}
		} as any;

		const result = parseOptimisationResult('Region X--lsm_only', variables, 'cases');

		expect(result).toEqual({
			region: 'Region X',
			intervention: 'lsm_only',
			cost: 250,
			cases: 120
		});
	});
});
describe('createGridRows', () => {
	it('should return an empty array when strategise results are empty', async () => {
		const { createGridRows } = await import('$routes/projects/[project]/strategise/utils');

		expect(createGridRows([], 100)).toEqual([]);
	});

	it('should create merged blocks across thresholds and close final block at maxCost', async () => {
		const { createGridRows } = await import('$routes/projects/[project]/strategise/utils');

		const strategiseResults = [
			{
				costThreshold: 0,
				interventions: [{ region: 'Region A', intervention: 'no_intervention', cost: 0, casesAverted: 0 }]
			},
			{
				costThreshold: 100,
				interventions: [{ region: 'Region A', intervention: 'irs_only', cost: 100, casesAverted: 10 }]
			},
			{
				costThreshold: 200,
				interventions: [{ region: 'Region A', intervention: 'irs_only', cost: 100, casesAverted: 10 }]
			},
			{
				costThreshold: 300,
				interventions: [{ region: 'Region A', intervention: 'lsm_only', cost: 200, casesAverted: 20 }]
			}
		] as any;

		const result = createGridRows(strategiseResults, 400);

		expect(result).toEqual([
			{
				region: 'Region A',
				blocks: [
					{ intervention: 'no_intervention', startCost: 0, endCost: 100 },
					{ intervention: 'irs_only', startCost: 100, endCost: 300 },
					{ intervention: 'lsm_only', startCost: 300, endCost: 400 }
				]
			}
		]);
	});

	it('should create blocks per region independently and preserve region order from first threshold', async () => {
		const strategiseResults = [
			{
				costThreshold: 10,
				interventions: [
					{ region: 'Region A', intervention: 'no_intervention', cost: 0, casesAverted: 0 },
					{ region: 'Region B', intervention: 'irs_only', cost: 50, casesAverted: 5 }
				]
			},
			{
				costThreshold: 20,
				interventions: [
					{ region: 'Region A', intervention: 'irs_only', cost: 50, casesAverted: 5 },
					{ region: 'Region B', intervention: 'irs_only', cost: 50, casesAverted: 5 }
				]
			},
			{
				costThreshold: 30,
				interventions: [
					{ region: 'Region A', intervention: 'irs_only', cost: 50, casesAverted: 5 },
					{ region: 'Region B', intervention: 'lsm_only', cost: 100, casesAverted: 10 }
				]
			}
		] as any;

		const result = createGridRows(strategiseResults, 40);

		expect(result).toEqual([
			{
				region: 'Region A',
				blocks: [
					{ intervention: 'no_intervention', startCost: 10, endCost: 20 },
					{ intervention: 'irs_only', startCost: 20, endCost: 40 }
				]
			},
			{
				region: 'Region B',
				blocks: [
					{ intervention: 'irs_only', startCost: 10, endCost: 30 },
					{ intervention: 'lsm_only', startCost: 30, endCost: 40 }
				]
			}
		]);
	});

	it('should ignore regions not present in the first strategise result', async () => {
		const { createGridRows } = await import('$routes/projects/[project]/strategise/utils');

		const strategiseResults = [
			{
				costThreshold: 0,
				interventions: [{ region: 'Region A', intervention: 'no_intervention', cost: 0, casesAverted: 0 }]
			},
			{
				costThreshold: 50,
				interventions: [
					{ region: 'Region A', intervention: 'irs_only', cost: 50, casesAverted: 5 },
					{ region: 'Region C', intervention: 'lsm_only', cost: 100, casesAverted: 10 }
				]
			}
		] as any;

		const result = createGridRows(strategiseResults, 100);

		expect(result).toEqual([
			{
				region: 'Region A',
				blocks: [
					{ intervention: 'no_intervention', startCost: 0, endCost: 50 },
					{ intervention: 'irs_only', startCost: 50, endCost: 100 }
				]
			}
		]);
	});
});
