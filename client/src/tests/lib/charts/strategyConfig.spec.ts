import {
	addBudgetPlotLine,
	BUDGET_PLOTLINE_ID,
	findClosestStrategiseResult,
	getBudgetPlotLine,
	getStrategiseSeries,
	getStrategyConfig
} from '$lib/charts/strategyConfig';
import type { StrategiseResults } from '$lib/types/userState';

describe('getStrategiseSeries', () => {
	it('should create series for each unique region', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [
					{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 },
					{ region: 'Region B', intervention: 'py_only_only', casesAverted: 150, cost: 1000 }
				]
			}
		];

		const series = getStrategiseSeries(mockData);

		expect(series).toHaveLength(2);
		expect(series[0].name).toBe('Region A');
		expect(series[1].name).toBe('Region B');
		expect(series[0].type).toBe('area');
		expect(series[1].type).toBe('area');
	});

	it('should aggregate data points for the same region across thresholds', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			},
			{
				costThreshold: 2000,
				interventions: [{ region: 'Region A', intervention: 'py_only_only', casesAverted: 200, cost: 2000 }]
			},
			{
				costThreshold: 3000,
				interventions: [{ region: 'Region A', intervention: 'lsm_only', casesAverted: 300, cost: 3000 }]
			}
		];

		const series = getStrategiseSeries(mockData);

		expect(series).toHaveLength(1);
		expect(series[0].data).toHaveLength(3);
		expect(series[0].data![0]).toMatchObject({ x: 1000, y: 100 });
		expect(series[0].data![1]).toMatchObject({ x: 2000, y: 200 });
		expect(series[0].data![2]).toMatchObject({ x: 3000, y: 300 });
	});
});

describe('getStrategyConfig', () => {
	it('should return valid Highcharts Options object', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			}
		];
		const mockSetStrategy = vi.fn();

		const config = getStrategyConfig(mockData, mockSetStrategy);

		expect(config.chart?.type).toBe('area');
		expect(config.chart?.height).toBe(450);
		expect(config.title?.text).toBe('Total Cases Averted vs Total Budget');
	});

	it('should configure xAxis with min and explored budget plotline', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			},
			{
				costThreshold: 5000,
				interventions: [{ region: 'Region A', intervention: 'py_only_only', casesAverted: 200, cost: 5000 }]
			}
		];
		const mockSetStrategy = vi.fn();

		const config = getStrategyConfig(mockData, mockSetStrategy);

		expect(config.xAxis).toBeDefined();
		const xAxis = config.xAxis as Highcharts.XAxisOptions;
		expect(xAxis.plotLines).toHaveLength(2);
		expect(xAxis.plotLines![0].value).toBe(1000);
		expect(xAxis.plotLines![0].label?.text).toBe('Minimum budget');
		expect(xAxis.plotLines![1].value).toBe(5000);
		expect(xAxis.plotLines![1].label?.text).toBe('Explored budget');
	});

	it('should disable legend item clicks', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			}
		];
		const mockSetStrategy = vi.fn();

		const config = getStrategyConfig(mockData, mockSetStrategy);

		expect(config.legend?.enabled).toBe(true);
		expect(config.legend?.events?.itemClick).toBeDefined();
	});

	it('should call functions when click event on chart is triggered', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			}
		];

		const mockSetStrategy = vi.fn();
		const mockChart = {
			xAxis: [
				{
					removePlotLine: vi.fn(),
					addPlotLine: vi.fn()
				}
			]
		} as unknown as Highcharts.Chart;
		const mockEvent = {
			xAxis: [{ value: 1500 }]
		} as Highcharts.ChartClickEventObject;

		const config = getStrategyConfig(mockData, mockSetStrategy);

		// Call the click handler with proper context
		config.chart!.events!.click!.call(mockChart, mockEvent);

		// Verify addBudgetPlotLine was called
		expect(mockChart.xAxis[0].removePlotLine).toHaveBeenCalledWith(BUDGET_PLOTLINE_ID);
		expect(mockChart.xAxis[0].addPlotLine).toHaveBeenCalled();

		// Verify setStrategy was called with closest result (1000 threshold)
		expect(mockSetStrategy).toHaveBeenCalledWith(mockData[0]);
	});

	it('should call functions when plotOptions click event is triggered', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			}
		];
		const mockSetStrategy = vi.fn();
		const mockSeries = {
			chart: {
				xAxis: [
					{
						removePlotLine: vi.fn(),
						addPlotLine: vi.fn()
					}
				]
			}
		} as unknown as Highcharts.Series;
		const mockEvent = {
			point: { x: 1200 }
		} as Highcharts.PointClickEventObject;

		const config = getStrategyConfig(mockData, mockSetStrategy);

		// Call the click handler with proper context
		config.plotOptions!.area!.events!.click!.call(mockSeries, mockEvent);

		// Verify addBudgetPlotLine was called
		expect(mockSeries.chart.xAxis[0].removePlotLine).toHaveBeenCalledWith(BUDGET_PLOTLINE_ID);
		expect(mockSeries.chart.xAxis[0].addPlotLine).toHaveBeenCalled();

		// Verify setStrategy was called with closest result (1000 threshold)
		expect(mockSetStrategy).toHaveBeenCalledWith(mockData[0]);
	});
});

describe('findClosestStrategiseResult', () => {
	it('should find the closest strategise result based on xValue', () => {
		const mockData: StrategiseResults = [
			{
				costThreshold: 1000,
				interventions: [{ region: 'Region A', intervention: 'irs_only', casesAverted: 100, cost: 1000 }]
			},
			{
				costThreshold: 3000,
				interventions: [{ region: 'Region B', intervention: 'py_only_only', casesAverted: 200, cost: 3000 }]
			},
			{
				costThreshold: 5000,
				interventions: [{ region: 'Region C', intervention: 'lsm_only', casesAverted: 300, cost: 5000 }]
			}
		];

		const result = findClosestStrategiseResult(mockData, 4000);
		expect(result.costThreshold).toBe(3000);

		const result2 = findClosestStrategiseResult(mockData, 6000);
		expect(result2.costThreshold).toBe(5000);

		const result3 = findClosestStrategiseResult(mockData, 800); // Below the lowest threshold
		expect(result3.costThreshold).toBe(1000);
	});
});

describe('addBudgetPlotLine', () => {
	it("should add & remove budget plot line on the chart's xAxis", () => {
		const mockRemovePlotLine = vi.fn();
		const mockAddPlotLine = vi.fn();
		const mockChart = {
			xAxis: [
				{
					removePlotLine: mockRemovePlotLine,
					addPlotLine: mockAddPlotLine
				}
			]
		} as unknown as Highcharts.Chart;

		addBudgetPlotLine(mockChart, 2000);

		expect(mockRemovePlotLine).toHaveBeenCalledWith(BUDGET_PLOTLINE_ID);
		expect(mockAddPlotLine).toHaveBeenCalledWith(getBudgetPlotLine(2000));
	});
});
