import { describe, it, expect } from 'vitest';
import { getCostConfigs } from '$lib/charts/costsConfig';
import type { CostCasesAndAverted } from '$lib/process-results/costs';
import type { Scenario } from '$lib/types/userState';

describe('getCostConfigs', () => {
	const mockPopulation = 10000;
	const mockCostsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>> = {
		irs_only: {
			totalCost: 50000,
			casesAverted: {
				casesAvertedMeanPer1000: 10.5,
				casesAvertedYear1Per1000: 8.2,
				casesAvertedYear2Per1000: 11.3,
				casesAvertedYear3Per1000: 12.0,
				totalAvertedCasesPer1000: 31.5
			}
		},
		py_only_only: {
			totalCost: 75000,
			casesAverted: {
				casesAvertedMeanPer1000: 25.8,
				casesAvertedYear1Per1000: 23.5,
				casesAvertedYear2Per1000: 26.1,
				casesAvertedYear3Per1000: 27.8,
				totalAvertedCasesPer1000: 77.4
			}
		},
		py_only_with_lsm: {
			totalCost: 95000,
			casesAverted: {
				casesAvertedMeanPer1000: 32.4,
				casesAvertedYear1Per1000: 30.1,
				casesAvertedYear2Per1000: 33.2,
				casesAvertedYear3Per1000: 33.9,
				totalAvertedCasesPer1000: 97.2
			}
		}
	};

	it('should return both config objects', () => {
		const result = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);

		expect(result).toHaveProperty('costPer1000Config');
		expect(result).toHaveProperty('costPerCaseConfig');
		expect(result.costPer1000Config).toBeDefined();
		expect(result.costPerCaseConfig).toBeDefined();
	});

	describe('costPer1000Config', () => {
		it('should create scatter series for each scenario', () => {
			const { costPer1000Config } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);

			expect(costPer1000Config.series).toHaveLength(3);
			expect(costPer1000Config.chart?.type).toBe('scatter');
		});

		it('should use correct marker symbols for LSM scenarios', () => {
			const { costPer1000Config } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);
			const series = costPer1000Config.series as any[];

			// Find LSM scenario
			const lsmSeries = series.find((s) => s.name.includes('with LSM'));
			const nonLsmSeries = series.find((s) => s.name === 'IRS Only');

			expect(lsmSeries.marker.symbol).toBe('diamond');
			expect(nonLsmSeries.marker.symbol).toBe('circle');
		});

		it('should calculate costs per 1000 correctly', () => {
			const { costPer1000Config } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);
			const series = costPer1000Config.series as any[];

			const irsSeries = series.find((s) => s.name === 'IRS Only');
			const [casesAverted, costPer1000] = irsSeries.data[0];

			expect(casesAverted).toBe(31.5);
			expect(costPer1000).toBe(5000); // 50000 / 10 = 5000 per 1000 people
		});
	});

	describe('costPerCaseConfig', () => {
		it('should configure xAxis with categories', () => {
			const { costPerCaseConfig } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);

			expect((costPerCaseConfig.xAxis as any).type).toBe('category');
			expect((costPerCaseConfig.xAxis as any).categories).toHaveLength(3);
			expect((costPerCaseConfig.xAxis as any).categories).toContain('IRS Only');
			expect((costPerCaseConfig.xAxis as any).categories).toContain('Pyrethroid ITN (Only)');
			expect((costPerCaseConfig.xAxis as any).categories).toContain('Pyrethroid ITN (with LSM)');
		});

		it('should configure yAxis with correct title', () => {
			const { costPerCaseConfig } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);

			expect((costPerCaseConfig.yAxis as any).title.text).toBe('Cost per case averted ($USD)');
		});

		it('should calculate cost per case correctly', () => {
			const { costPerCaseConfig } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);
			const series = costPerCaseConfig.series as any[];
			const data = series[0].data;

			// For irs_only: 50000 / (31.5 * 10000 / 1000) = 50000 / 315 ≈ 158.73
			expect(data[0].y).toBeCloseTo(158.73, 1);

			// For py_only_only: 75000 / (77.4 * 10000 / 1000) = 75000 / 774 ≈ 96.90
			expect(data[1].y).toBeCloseTo(96.9, 1);
		});

		it('should configure tooltip with dollar prefix', () => {
			const { costPerCaseConfig } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);

			expect(costPerCaseConfig.tooltip?.valueDecimals).toBe(2);
			expect(costPerCaseConfig.tooltip?.valuePrefix).toBe('$');
		});
	});

	describe('edge cases', () => {
		it('should handle empty costs and cases averted', () => {
			const result = getCostConfigs({}, mockPopulation);

			expect(result.costPer1000Config.series as any[]).toHaveLength(0);
			expect((result.costPerCaseConfig.series as any[])[0].data).toHaveLength(0);
		});

		it('should handle single scenario', () => {
			const singleScenario: Partial<Record<Scenario, CostCasesAndAverted>> = {
				irs_only: {
					totalCost: 50000,
					casesAverted: {
						casesAvertedMeanPer1000: 10.5,
						casesAvertedYear1Per1000: 8.2,
						casesAvertedYear2Per1000: 11.3,
						casesAvertedYear3Per1000: 12.0,
						totalAvertedCasesPer1000: 31.5
					}
				}
			};

			const result = getCostConfigs(singleScenario, mockPopulation);

			expect(result.costPer1000Config.series as any[]).toHaveLength(1);
			expect((result.costPerCaseConfig.series as any[])[0].data).toHaveLength(1);
		});

		it('should round data points to 2 decimal places in scatter chart', () => {
			const { costPer1000Config } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);
			const series = costPer1000Config.series as any[];

			series.forEach((s) => {
				s.data.forEach(([x, y]: number[]) => {
					expect(x.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
					expect(y.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
				});
			});
		});

		it('should maintain scenario order from input object', () => {
			const { costPerCaseConfig } = getCostConfigs(mockCostsAndCasesAverted, mockPopulation);
			const categories = (costPerCaseConfig.xAxis as any).categories;

			expect(categories[0]).toBe('IRS Only');
			expect(categories[1]).toBe('Pyrethroid ITN (Only)');
			expect(categories[2]).toBe('Pyrethroid ITN (with LSM)');
		});
	});
});
