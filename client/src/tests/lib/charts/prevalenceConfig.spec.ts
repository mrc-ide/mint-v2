import { ScenarioToLabel } from '$lib/charts/baseChart';
import { getPrevalenceConfig } from '$lib/charts/prevalenceConfig';
import { SCENARIOS, type PrevalenceData } from '$lib/types/userState';

describe('createPrevalenceSeries', () => {
	it('should create series for each unique scenario in correct order', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.12 },
			{ scenario: 'py_only_only', days: 365, prevalence: 0.1 },
			{ scenario: 'py_only_only', days: 730, prevalence: 0.08 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		SCENARIOS.filter((scenario) => ['irs_only', 'py_only_only'].includes(scenario)).forEach((scenario, index) => {
			expect(series[index].name).toBe(ScenarioToLabel[scenario]);
		});
		expect(series).toHaveLength(2);
	});

	it('should convert days to years since intervention (days/365 - 1)', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 0, prevalence: 0.2 },
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.12 },
			{ scenario: 'irs_only', days: 1095, prevalence: 0.1 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		expect(series[0].data).toEqual([
			[-1, 20], // day 0: 0/365 - 1 = -1
			[0, 15], // day 365: 365/365 - 1 = 0
			[1, 12], // day 730: 730/365 - 1 = 1
			[2, 10] // day 1095: 1095/365 - 1 = 2
		]);
	});

	it('should convert prevalence to percentage (multiply by 100)', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 365, prevalence: 0.153 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.089 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as any[];

		expect(series[0].data![0][1].toFixed(1)).toBe('15.3');
		expect(series[0].data![1][1].toFixed(1)).toBe('8.9');
	});

	it('should apply dash style to LSM scenarios', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'py_only_only', days: 365, prevalence: 0.1 },
			{ scenario: 'py_only_with_lsm', days: 365, prevalence: 0.08 },
			{ scenario: 'lsm_only', days: 365, prevalence: 0.09 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		const nonLsmSeries = series.find((s) => s.name === 'Pyrethroid ITN (Only)');
		const withLsmSeries = series.find((s) => s.name === 'Pyrethroid ITN (with LSM)');
		const lsmOnlySeries = series.find((s) => s.name === 'LSM Only');

		expect(nonLsmSeries?.dashStyle).toBeUndefined();
		expect(withLsmSeries?.dashStyle).toBe('Dash');
		expect(lsmOnlySeries?.dashStyle).toBe('Dash');
	});

	it('should handle empty data array', () => {
		const config = getPrevalenceConfig([]);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		expect(series).toHaveLength(0);
	});

	it('should handle multiple scenarios with varying data points', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 0, prevalence: 0.2 },
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 },
			{ scenario: 'py_only_only', days: 365, prevalence: 0.12 },
			{ scenario: 'py_only_only', days: 730, prevalence: 0.1 },
			{ scenario: 'py_only_only', days: 1095, prevalence: 0.08 },
			{ scenario: 'lsm_only', days: 365, prevalence: 0.14 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		expect(series).toHaveLength(3);
		expect(series.find((s) => s.name === 'IRS Only')?.data).toHaveLength(2);
		expect(series.find((s) => s.name === 'Pyrethroid ITN (Only)')?.data).toHaveLength(3);
		expect(series.find((s) => s.name === 'LSM Only')?.data).toHaveLength(1);
	});

	it('should preserve data point order', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 1095, prevalence: 0.1 },
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.12 }
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as Highcharts.SeriesSplineOptions[];

		// Data should be in the order it was added (not sorted)
		expect(series[0].data![0]).toEqual([2, 10]); // day 1095
		expect(series[0].data![1]).toEqual([0, 15]); // day 365
		expect(series[0].data![2]).toEqual([1, 12]); // day 730
	});

	it('should handle fractional days correctly', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 182.5, prevalence: 0.18 }, // Half year
			{ scenario: 'irs_only', days: 547.5, prevalence: 0.14 } // 1.5 years
		];

		const config = getPrevalenceConfig(mockData);
		const series = config.series as any[];

		expect(series[0].data![0][0]).toBeCloseTo(-0.5, 2);
		expect(series[0].data![1][0]).toBeCloseTo(0.5, 2);
	});
});

describe('getPrevalenceConfig', () => {
	it('should return a valid Highcharts Options object', () => {
		const mockData: PrevalenceData[] = [{ scenario: 'irs_only', days: 365, prevalence: 0.15 }];

		const config = getPrevalenceConfig(mockData);

		expect(config.chart?.type).toBe('spline');
	});

	it('should include series data', () => {
		const mockData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 },
			{ scenario: 'py_only_only', days: 365, prevalence: 0.12 }
		];

		const config = getPrevalenceConfig(mockData);

		expect((config.series as any).length).toBe(2);
	});
});
