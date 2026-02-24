import { describe, it, expect } from 'vitest';
import {
	createBreakToMinimizeEmptySpace,
	createCasesCompareDataPoints,
	createCasesCompareSeries,
	getCasesConfig,
	getCasesCompareConfig,
	createCompareTooltipHtml
} from '$lib/charts/casesConfig';
import * as processCases from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import * as costs from '$lib/process-results/costs';
import type { PointOptionsObject } from 'highcharts';
describe('getCasesConfig', () => {
	const mockCasesAverted: Partial<Record<Scenario, processCases.CasesAverted>> = {
		irs_only: {
			casesAvertedMeanPer1000: 10.5,
			casesAvertedYear1Per1000: 8.2,
			casesAvertedYear2Per1000: 11.3,
			casesAvertedYear3Per1000: 12.0,
			totalAvertedCasesPer1000: 31.5
		},
		py_only_only: {
			casesAvertedMeanPer1000: 25.8,
			casesAvertedYear1Per1000: 23.5,
			casesAvertedYear2Per1000: 26.1,
			casesAvertedYear3Per1000: 27.8,
			totalAvertedCasesPer1000: 79.4
		},
		py_only_with_lsm: {
			casesAvertedMeanPer1000: 32.4,
			casesAvertedYear1Per1000: 30.1,
			casesAvertedYear2Per1000: 33.2,
			casesAvertedYear3Per1000: 33.9,
			totalAvertedCasesPer1000: 97.2
		}
	};

	it('should return a valid Highcharts Options object', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config).toBeDefined();
		expect(config.chart?.type).toBe('column');
	});

	it('should configure xAxis with categories from scenarios', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config.xAxis).toBeDefined();
		expect((config.xAxis as any).type).toBe('category');
		expect((config.xAxis as any).categories).toHaveLength(3);
		expect((config.xAxis as any).categories).toContain('IRS Only');
		expect((config.xAxis as any).categories).toContain('Pyrethroid ITN (Only)');
		expect((config.xAxis as any).categories).toContain('Pyrethroid ITN (with LSM)');
	});

	it('should create series data with column and line types', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config.series).toHaveLength(4); // mean + 3 line series for each scenario
	});

	it('should create column series with mean data', () => {
		const config = getCasesConfig(mockCasesAverted);
		const columnSeries = (config.series as any)[0];

		expect(columnSeries.name).toBe('Mean');
		expect(columnSeries.type).toBe('column');
		expect(columnSeries.data).toHaveLength(3);
		expect(columnSeries.data[0].y).toBe(10.5);
		expect(columnSeries.data[1].y).toBe(25.8);
		expect(columnSeries.data[2].y).toBe(32.4);
	});

	it('should include color patterns in column data', () => {
		const config = getCasesConfig(mockCasesAverted);
		const columnSeries = (config.series as any)[0];

		columnSeries.data.forEach((point: any) => {
			expect(point.color).toBeDefined();
			expect(point.color.pattern).toBeDefined();
			expect(point.color.pattern.color).toBeDefined();
		});
	});

	it('should create line series for each scenario with yearly data', () => {
		const config = getCasesConfig(mockCasesAverted);
		const lineSeries = (config.series as any[]).slice(1);

		expect(lineSeries).toHaveLength(3);

		lineSeries.forEach((series: any, index: number) => {
			expect(series.type).toBe('line');
			expect(series.data).toHaveLength(3); // Year 1, 2, 3
			expect(series.data[0].name).toBe('Year 1');
			expect(series.data[1].name).toBe('Year 2');
			expect(series.data[2].name).toBe('Year 3');
			expect(series.data[0].x).toBe(index - 0.3);
			expect(series.data[1].x).toBe(index);
			expect(series.data[2].x).toBe(index + 0.3);
		});
	});

	it('should configure line series with correct styling', () => {
		const config = getCasesConfig(mockCasesAverted);
		const lineSeries = (config.series as any)[1];

		expect(lineSeries.color).toBe('var(--foreground)');
		expect(lineSeries.marker.enabled).toBe(true);
		expect(lineSeries.marker.symbol).toBe('circle');
		expect(lineSeries.lineWidth).toBe(2);
		expect(lineSeries.dashStyle).toBe('Dash');
	});

	it('should map scenario names to labels', () => {
		const config = getCasesConfig(mockCasesAverted);
		const columnSeries = (config.series as any)[0];

		expect(columnSeries.data[0].name).toBe('IRS Only');
		expect(columnSeries.data[1].name).toBe('Pyrethroid ITN (Only)');
		expect(columnSeries.data[2].name).toBe('Pyrethroid ITN (with LSM)');
	});

	it('should configure plot options correctly', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config.plotOptions?.column?.groupPadding).toBe(0.05);
		expect(config.plotOptions?.line?.tooltip?.headerFormat).toBe(
			'<span style="font-size: 10px">{series.name}</span><br/>'
		);
		expect(config.plotOptions?.line?.tooltip?.pointFormat).toBe(
			'<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y:.1f}</b><br/>'
		);
	});

	it('should disable legend', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config.legend?.enabled).toBe(false);
	});

	it('should set tooltip value decimals', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect(config.tooltip?.valueDecimals).toBe(1);
	});

	it('should handle empty cases averted object', () => {
		const config = getCasesConfig({});

		expect(config.series).toHaveLength(1);
		expect((config.series as any)[0].data).toHaveLength(0);
	});

	it('should handle single scenario', () => {
		const singleScenario: Partial<Record<Scenario, processCases.CasesAverted>> = {
			irs_only: {
				casesAvertedMeanPer1000: 15.2,
				casesAvertedYear1Per1000: 14.0,
				casesAvertedYear2Per1000: 15.5,
				casesAvertedYear3Per1000: 16.1,
				totalAvertedCasesPer1000: 45.6
			}
		};

		const config = getCasesConfig(singleScenario);

		expect(config.series).toHaveLength(2); // 1 column + 1 line
		expect((config.series as any)[0].data).toHaveLength(1);
		expect((config.xAxis as any).categories).toHaveLength(1);
	});

	it('should configure xAxis accessibility', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect((config.xAxis as any).accessibility?.description).toBe('Intervention types');
	});

	it('should set xAxis label padding', () => {
		const config = getCasesConfig(mockCasesAverted);

		expect((config.xAxis as any).labels?.padding).toBe(8);
	});

	it('should preserve all yearly data points', () => {
		const config = getCasesConfig(mockCasesAverted);
		const firstLineSeries = (config.series as any)[1];

		expect(firstLineSeries.data[0].y).toBe(8.2);
		expect(firstLineSeries.data[1].y).toBe(11.3);
		expect(firstLineSeries.data[2].y).toBe(12.0);
	});
});

describe('cases compare config', () => {
	const mockCases: CasesData[] = [
		{ scenario: 'irs_only', casesPer1000: 10, year: 2 },
		{ scenario: 'irs_only', casesPer1000: 10, year: 3 },
		{ scenario: 'py_only_only', casesPer1000: 20, year: 2 },
		{ scenario: 'py_only_only', casesPer1000: 20, year: 3 },
		{ scenario: 'py_only_with_lsm', casesPer1000: 15, year: 2 },
		{ scenario: 'py_only_with_lsm', casesPer1000: 15, year: 3 }
	];

	const mockPresentFormValues: Record<string, FormValue> = {
		population: 10000
	};
	const mockLongTermFormValues: Record<string, FormValue> = {
		population: 20000
	};

	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(processCases, 'collectPostInterventionCases');
		vi.spyOn(processCases, 'getTotalCasesPer1000').mockReturnValue(100);
		vi.spyOn(processCases, 'convertPer1000ToTotal').mockReturnValue(1000);
		vi.spyOn(costs, 'getTotalCostsPerScenario').mockReturnValue({
			irs_only: 5000,
			py_only_only: 2000,
			py_only_with_lsm: 8000
		});
	});

	describe('createCasesCompareDataPoints', () => {
		it('should return sorted data points based on totalCost in ascending order', () => {
			const result = createCasesCompareDataPoints(mockCases, mockPresentFormValues);

			expect(result[0]).toEqual({
				scenario: 'py_only_only',
				totalCases: 1000,
				totalCost: 2000
			});
			expect(result[1]).toEqual({
				scenario: 'irs_only',
				totalCases: 1000,
				totalCost: 5000
			});
			expect(result[2]).toEqual({
				scenario: 'py_only_with_lsm',
				totalCases: 1000,
				totalCost: 8000
			});

			expect(processCases.collectPostInterventionCases).toHaveBeenCalledWith(mockCases);
			expect(costs.getTotalCostsPerScenario).toHaveBeenCalledWith(
				['py_only_only', 'irs_only', 'py_only_with_lsm'],
				mockPresentFormValues
			);
			expect(processCases.getTotalCasesPer1000).toHaveBeenCalledTimes(3);
			expect(processCases.convertPer1000ToTotal).toHaveBeenCalledTimes(3);
			expect(processCases.convertPer1000ToTotal).toHaveBeenCalledWith(100, mockPresentFormValues['population']);
		});

		it('should handle empty cases array', () => {
			const result = createCasesCompareDataPoints([], mockPresentFormValues);
			expect(result).toEqual([]);
		});
	});

	describe('createCasesCompareSeries', () => {
		it('should create a series with correct name and data points', () => {
			const series = createCasesCompareSeries(mockCases, mockPresentFormValues, 'Present');

			expect(series.name).toBe('Present');
			expect(series.type).toBe('line');
			expect(series.step).toBe('left');

			expect(series.data).toHaveLength(3);
			expect(series.data![0]).toEqual({
				x: 2000,
				y: 1000,
				custom: { intervention: 'Pyrethroid ITN (Only)' }
			});
			expect(series.data![1]).toEqual({
				x: 5000,
				y: 1000,
				custom: { intervention: 'IRS Only' }
			});
			expect(series.data![2]).toEqual({
				x: 8000,
				y: 1000,
				custom: { intervention: 'Pyrethroid ITN (with LSM)' }
			});
		});
	});

	describe('createBreakToMinimizeEmptySpace', () => {
		it('should return undefined when both datasets have only one point', () => {
			const data1: PointOptionsObject[] = [{ x: 1000, y: 500 }];
			const data2: PointOptionsObject[] = [{ x: 2000, y: 600 }];

			const result = createBreakToMinimizeEmptySpace(data1, data2);

			expect(result).toBeUndefined();
		});

		it('should calculate break point based on the smaller second x value', () => {
			const data1: PointOptionsObject[] = [
				{ x: 0, y: 100 },
				{ x: 5000, y: 200 }
			];
			const data2: PointOptionsObject[] = [
				{ x: 0, y: 150 },
				{ x: 3000, y: 250 }
			];

			const result = createBreakToMinimizeEmptySpace(data1, data2);

			expect(result).toHaveLength(1);
			expect(result![0].from).toBe(0);
			expect(result![0].to).toBe(3000 * 0.9);
		});

		it('should set break size to 20% of the break point', () => {
			const data1: PointOptionsObject[] = [
				{ x: 0, y: 100 },
				{ x: 10000, y: 200 }
			];
			const data2: PointOptionsObject[] = [
				{ x: 0, y: 150 },
				{ x: 5000, y: 250 }
			];

			const result = createBreakToMinimizeEmptySpace(data1, data2);

			expect(result).toHaveLength(1);
			expect(result![0].breakSize).toBe(5000 * 0.9 * 0.2);
		});
	});

	describe('createCompareTooltipHtml', () => {
		it('should include data from all series with matching intervention', () => {
			const mockPoint1 = {
				setState: vi.fn(),
				options: { custom: { intervention: 'IRS Only' } },
				y: 1500,
				x: 5000
			};
			const mockPoint2 = {
				setState: vi.fn(),
				options: { custom: { intervention: 'Pyrethroid ITN (Only)' } },
				y: 2000,
				x: 3000
			};
			const mockPoint3 = {
				setState: vi.fn(),
				options: { custom: { intervention: 'IRS Only' } },
				y: 1800,
				x: 6000
			};

			const mockSeries1 = {
				name: 'Present',
				color: '#ff0000',
				points: [mockPoint1, mockPoint2]
			};
			const mockSeries2 = {
				name: 'Long term',
				color: '#00ff00',
				points: [mockPoint3]
			};

			const mockThis = {
				options: {
					custom: { intervention: 'IRS Only' }
				},
				series: {
					chart: {
						series: [mockSeries1, mockSeries2]
					}
				}
			} as any;

			const result = createCompareTooltipHtml.call(mockThis);

			expect(result).toContain('<div class="mb-1"><span class="font-semibold ">IRS Only</span></div>');
			expect(result).toContain('Present');
			expect(result).toContain('Long term');
			expect(result).toContain('1,500.0 cases');
			expect(result).toContain('$5,000');
			expect(result).toContain('1,800.0 cases');
			expect(result).toContain('$6,000');
			expect(result).not.toContain('2,000.0 cases');
		});

		it('should set hover state on matching points', () => {
			const mockPoint1 = {
				setState: vi.fn(),
				options: { custom: { intervention: 'IRS Only' } },
				y: 1500,
				x: 5000
			};
			const mockPoint2 = {
				setState: vi.fn(),
				options: { custom: { intervention: 'IRS Only' } },
				y: 1800,
				x: 6000
			};

			const mockSeries1 = {
				name: 'Present',
				color: '#ff0000',
				points: [mockPoint1]
			};
			const mockSeries2 = {
				name: 'Long term',
				color: '#00ff00',
				points: [mockPoint2]
			};

			const mockThis = {
				options: {
					custom: { intervention: 'IRS Only' }
				},
				series: {
					chart: {
						series: [mockSeries1, mockSeries2]
					}
				}
			} as any;

			createCompareTooltipHtml.call(mockThis);

			expect(mockPoint1.setState).toHaveBeenCalledWith('');
			expect(mockPoint1.setState).toHaveBeenCalledWith('hover');
			expect(mockPoint2.setState).toHaveBeenCalledWith('');
			expect(mockPoint2.setState).toHaveBeenCalledWith('hover');
		});

		it('should format large numbers with locale string', () => {
			const mockPoint = {
				setState: vi.fn(),
				options: { custom: { intervention: 'IRS Only' } },
				y: 1234567.89,
				x: 9876543.21
			};

			const mockSeries = {
				name: 'Present',
				color: '#ff0000',
				points: [mockPoint]
			};

			const mockThis = {
				options: {
					custom: { intervention: 'IRS Only' }
				},
				series: {
					chart: {
						series: [mockSeries]
					}
				}
			} as any;

			const result = createCompareTooltipHtml.call(mockThis);

			expect(result).toContain('1,234,567.9 cases');
			expect(result).toContain('$9,876,543');
		});
	});

	describe('getCasesCompareConfig integration', () => {
		const mockCurrentCases: CasesData[] = [
			{ scenario: 'irs_only', casesPer1000: 10, year: 2 },
			{ scenario: 'irs_only', casesPer1000: 10, year: 3 }
		];

		const mockNewCases: CasesData[] = [
			{ scenario: 'py_only_only', casesPer1000: 20, year: 2 },
			{ scenario: 'py_only_only', casesPer1000: 20, year: 3 }
		];

		it('should return a valid Highcharts Options object', () => {
			const config = getCasesCompareConfig(
				mockCurrentCases,
				mockNewCases,
				mockNewCases,
				mockPresentFormValues,
				mockLongTermFormValues
			);

			expect(config).toBeDefined();
			expect(config.chart?.type).toBe('line');
			expect(config.chart?.height).toBe(450);
			expect(config.title?.text).toBe('Present vs Long term - Total Cases vs Total Cost');
			expect(config.subtitle?.text).toBe('Step lines indicate changes in intervention strategy as budget increases.');
		});

		it('should include both Present and Long term series when newCases has data', () => {
			const config = getCasesCompareConfig(
				mockCurrentCases,
				mockNewCases,
				mockNewCases,
				mockPresentFormValues,
				mockLongTermFormValues
			);

			expect(config.series).toHaveLength(3);
			expect((config.series as any)[0].name).toBe('Present');
			expect((config.series as any)[1].name).toBe('Long term (baseline only)');
			expect((config.series as any)[2].name).toBe('Long term (baseline + control strategy)');
		});

		it('should include only Present series when newCases is empty', () => {
			vi.spyOn(processCases, 'collectPostInterventionCases').mockReturnValue({} as any);

			const config = getCasesCompareConfig(mockCurrentCases, [], [], mockPresentFormValues, mockLongTermFormValues);

			expect(config.series).toHaveLength(1);
			expect((config.series as any)[0].name).toBe('Present');
		});

		it('should apply breaks to xAxis when data points exist', () => {
			vi.spyOn(processCases, 'collectPostInterventionCases').mockReturnValue({
				irs_only: mockCurrentCases.filter((c) => c.scenario === 'irs_only'),
				py_only_only: mockNewCases.filter((c) => c.scenario === 'py_only_only')
			} as any);
			vi.spyOn(costs, 'getTotalCostsPerScenario').mockReturnValue({
				irs_only: 1000,
				py_only_only: 5000
			});

			const config = getCasesCompareConfig(
				mockCurrentCases,
				mockNewCases,
				mockNewCases,
				mockPresentFormValues,
				mockLongTermFormValues
			);

			expect((config.xAxis as any).breaks).toBeDefined();
		});

		it('should pass data to createCasesCompareSeries correctly', () => {
			getCasesCompareConfig(
				mockCurrentCases,
				mockNewCases,
				mockNewCases,
				mockPresentFormValues,
				mockLongTermFormValues
			);

			// Verify the function processes the data through helper functions
			expect(processCases.collectPostInterventionCases).toHaveBeenCalled();
			expect(costs.getTotalCostsPerScenario).toHaveBeenCalled();
		});

		it('should set tooltip formatter to createCompareTooltipHtml', () => {
			const config = getCasesCompareConfig(
				mockCurrentCases,
				mockNewCases,
				mockNewCases,
				mockPresentFormValues,
				mockLongTermFormValues
			);

			expect(config.tooltip?.formatter).toBe(createCompareTooltipHtml);
		});
	});
});
