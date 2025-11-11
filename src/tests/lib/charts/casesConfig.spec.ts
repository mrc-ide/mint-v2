import { describe, it, expect } from 'vitest';
import { getCasesConfig } from '$lib/charts/casesConfig';
import type { CasesAverted } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';

describe('getCasesConfig', () => {
	const mockCasesAverted: Partial<Record<Scenario, CasesAverted>> = {
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
		const singleScenario: Partial<Record<Scenario, CasesAverted>> = {
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
