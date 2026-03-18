import {
	addBudgetPlotLine,
	addCasesPlotLine,
	BUDGET_PLOTLINE_ID,
	CASES_PLOT_LINE_ID,
	findClosestStrategiseResult,
	getBudgetPlotLine,
	getCasesPlotLine,
	getClosestPoint,
	getCompareStrategiseSeries,
	getCompareStrategyConfig,
	getCompareStrategyConfigs,
	getStrategiseSeries,
	getStrategyConfig
} from '$lib/charts/strategyConfig';
import type { CompareStrategiseResult, CompareStrategiseResults, StrategiseResults } from '$lib/types/userState';

describe('Strategise cases averted', () => {
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
			expect(config.title?.text).toBe('Total Clinical Cases Averted and Cost of Strategy');
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
});

describe('Strategise compare', () => {
	describe('addCases plot line', () => {
		it("should add & remove cases plot line on the chart's y axis", () => {
			const mockRemovePlotLine = vi.fn();
			const mockAddPlotLine = vi.fn();
			const mockChart = {
				yAxis: [
					{
						removePlotLine: mockRemovePlotLine,
						addPlotLine: mockAddPlotLine
					}
				]
			} as unknown as Highcharts.Chart;

			addCasesPlotLine(mockChart, 2000);

			expect(mockRemovePlotLine).toHaveBeenCalledWith(CASES_PLOT_LINE_ID);
			expect(mockAddPlotLine).toHaveBeenCalledWith(getCasesPlotLine(2000));
		});
	});

	describe('getCompareStrategiseSeries', () => {
		it('should create series for each unique region', () => {
			const mockData: CompareStrategiseResult = [
				{
					costThreshold: 1000,
					interventions: [
						{ region: 'Region A', intervention: 'irs_only', cases: 100, cost: 1000 },
						{ region: 'Region B', intervention: 'py_only_only', cases: 150, cost: 1000 }
					]
				}
			];

			const series = getCompareStrategiseSeries(mockData);

			expect(series).toHaveLength(2);
			expect(series[0].name).toBe('Region A');
			expect(series[1].name).toBe('Region B');
			expect(series[0].type).toBe('area');
			expect(series[1].type).toBe('area');
		});

		it('should aggregate data points for the same region across thresholds', () => {
			const mockData: CompareStrategiseResult = [
				{
					costThreshold: 1000,
					interventions: [{ region: 'Region A', intervention: 'irs_only', cases: 100, cost: 1000 }]
				},
				{
					costThreshold: 2000,
					interventions: [{ region: 'Region A', intervention: 'py_only_only', cases: 200, cost: 2000 }]
				},
				{
					costThreshold: 3000,
					interventions: [{ region: 'Region A', intervention: 'lsm_only', cases: 300, cost: 3000 }]
				}
			];

			const series = getCompareStrategiseSeries(mockData);

			expect(series).toHaveLength(1);
			expect(series[0].data).toHaveLength(3);
			expect(series[0].data![0]).toMatchObject({ x: 1000, y: 100 });
			expect(series[0].data![1]).toMatchObject({ x: 2000, y: 200 });
			expect(series[0].data![2]).toMatchObject({ x: 3000, y: 300 });
		});
	});

	describe('Strategise compare config and sync behavior', () => {
		describe('getClosestPoint', () => {
			it('should return null when there are no points', () => {
				const result = getClosestPoint(1000, [] as Highcharts.Series[]);
				expect(result).toBeNull();
			});

			it('should return the point with x closest to the provided cost across all series', () => {
				const series = [
					{
						data: [{ x: 1000 }, { x: 3000 }]
					},
					{
						data: [{ x: 2200 }]
					}
				] as unknown as Highcharts.Series[];

				const result = getClosestPoint(2100, series);

				expect(result).not.toBeNull();
				expect(result!.x).toBe(2200);
			});

			it('should keep the first encountered point when distances are tied', () => {
				const firstPoint = { x: 1000 };
				const secondPoint = { x: 3000 };
				const series = [
					{
						data: [firstPoint, secondPoint]
					}
				] as unknown as Highcharts.Series[];

				const result = getClosestPoint(2000, series);

				expect(result).toBe(firstPoint as unknown as Highcharts.Point);
			});
		});

		describe('getCompareStrategyConfig', () => {
			it('should return expected chart options including y-axis max padding', () => {
				const mockData: CompareStrategiseResult = [
					{
						costThreshold: 1000,
						interventions: [{ region: 'Region A', intervention: 'irs_only', cases: 80, cost: 1000 }]
					}
				];
				const onCasesPlotLineAdded = vi.fn();

				const config = getCompareStrategyConfig(mockData, 'Present (current controls)', 200, onCasesPlotLineAdded);

				expect(config.chart?.type).toBe('area');
				expect(config.chart?.height).toBe(500);
				expect(config.title?.text).toBe('Present (current controls)');
				expect((config.yAxis as Highcharts.YAxisOptions).max).toBeCloseTo(220);
			});

			it('should update cases plot line and call callback when chart click is triggered', () => {
				const mockData: CompareStrategiseResult = [
					{
						costThreshold: 1000,
						interventions: [{ region: 'Region A', intervention: 'irs_only', cases: 80, cost: 1000 }]
					}
				];
				const onCasesPlotLineAdded = vi.fn();

				const config = getCompareStrategyConfig(mockData, 'Long-term (adjusted controls)', 200, onCasesPlotLineAdded);

				const mockChart = {
					yAxis: [
						{
							removePlotLine: vi.fn(),
							addPlotLine: vi.fn()
						}
					],
					series: [
						{
							data: [
								{ x: 1000, total: 120 },
								{ x: 2000, total: 90 }
							]
						}
					]
				} as unknown as Highcharts.Chart;

				const mockEvent = {
					xAxis: [{ value: 1800 }]
				} as Highcharts.ChartClickEventObject;

				config.chart!.events!.click!.call(mockChart, mockEvent);

				expect(mockChart.yAxis[0].removePlotLine).toHaveBeenCalledWith(CASES_PLOT_LINE_ID);
				expect(mockChart.yAxis[0].addPlotLine).toHaveBeenCalledWith(getCasesPlotLine(90));
				expect(onCasesPlotLineAdded).toHaveBeenCalledWith(90);
			});

			it('should update cases plot line and call callback when area click is triggered', () => {
				const mockData: CompareStrategiseResult = [
					{
						costThreshold: 1000,
						interventions: [{ region: 'Region A', intervention: 'irs_only', cases: 80, cost: 1000 }]
					}
				];
				const onCasesPlotLineAdded = vi.fn();

				const config = getCompareStrategyConfig(mockData, 'Present (current controls)', 200, onCasesPlotLineAdded);

				const mockSeries = {
					chart: {
						yAxis: [
							{
								removePlotLine: vi.fn(),
								addPlotLine: vi.fn()
							}
						]
					}
				} as unknown as Highcharts.Series;

				const mockEvent = {
					point: { total: 123.4 }
				} as Highcharts.PointClickEventObject;

				config.plotOptions!.area!.events!.click!.call(mockSeries, mockEvent);

				expect(mockSeries.chart.yAxis[0].removePlotLine).toHaveBeenCalledWith(CASES_PLOT_LINE_ID);
				expect(mockSeries.chart.yAxis[0].addPlotLine).toHaveBeenCalledWith(getCasesPlotLine(123.4));
				expect(onCasesPlotLineAdded).toHaveBeenCalledWith(123.4);
			});
		});

		describe('getCompareStrategyConfigs', () => {
			it('should synchronize selected strategies and mirrored cases plot lines between charts', () => {
				const present: CompareStrategiseResult = [
					{
						costThreshold: 1000,
						interventions: [
							{ region: 'Region A', intervention: 'irs_only', cases: 60, cost: 600 },
							{ region: 'Region B', intervention: 'py_only_only', cases: 40, cost: 400 } // total 100
						]
					},
					{
						costThreshold: 2000,
						interventions: [{ region: 'Region A', intervention: 'lsm_only', cases: 80, cost: 2000 }] // total 80
					}
				];

				const longTerm: CompareStrategiseResult = [
					{
						costThreshold: 1000,
						interventions: [{ region: 'Region A', intervention: 'irs_only', cases: 120, cost: 1000 }] // total 120
					},
					{
						costThreshold: 2000,
						interventions: [{ region: 'Region A', intervention: 'py_only_only', cases: 100, cost: 2000 }] // total 100
					},
					{
						costThreshold: 3000,
						interventions: [{ region: 'Region A', intervention: 'lsm_only', cases: 70, cost: 3000 }] // total 70
					}
				];

				const presentChart = {
					yAxis: [
						{
							removePlotLine: vi.fn(),
							addPlotLine: vi.fn()
						}
					]
				} as unknown as Highcharts.Chart;

				const longTermChart = {
					yAxis: [
						{
							removePlotLine: vi.fn(),
							addPlotLine: vi.fn()
						}
					]
				} as unknown as Highcharts.Chart;

				const selectedStrategies: {
					presentStrategy: null | CompareStrategiseResult[number];
					longTermStrategy: null | CompareStrategiseResult[number];
				} = {
					presentStrategy: null,
					longTermStrategy: null
				};

				const { presentConfig, longTermConfig } = getCompareStrategyConfigs(
					{ present, longTerm } as NonNullable<CompareStrategiseResults>,
					() => ({ presentChart, longTermChart }),
					selectedStrategies
				);

				expect((presentConfig.yAxis as Highcharts.YAxisOptions).max).toBe(132);
				expect((longTermConfig.yAxis as Highcharts.YAxisOptions).max).toBe(132);

				const presentSeriesContext = {
					chart: {
						yAxis: [
							{
								removePlotLine: vi.fn(),
								addPlotLine: vi.fn()
							}
						]
					}
				} as unknown as Highcharts.Series;

				presentConfig.plotOptions!.area!.events!.click!.call(presentSeriesContext, {
					point: { total: 100 }
				} as Highcharts.PointClickEventObject);

				expect(selectedStrategies.presentStrategy).toBe(present[0]);
				expect(selectedStrategies.longTermStrategy).toBe(longTerm[1]);
				expect(longTermChart.yAxis[0].removePlotLine).toHaveBeenCalledWith(CASES_PLOT_LINE_ID);
				expect(longTermChart.yAxis[0].addPlotLine).toHaveBeenCalledWith(getCasesPlotLine(100));

				const longTermSeriesContext = {
					chart: {
						yAxis: [
							{
								removePlotLine: vi.fn(),
								addPlotLine: vi.fn()
							}
						]
					}
				} as unknown as Highcharts.Series;

				longTermConfig.plotOptions!.area!.events!.click!.call(longTermSeriesContext, {
					point: { total: 70 }
				} as Highcharts.PointClickEventObject);

				expect(selectedStrategies.longTermStrategy).toBe(longTerm[2]);
				expect(selectedStrategies.presentStrategy).toBeNull();
				expect(presentChart.yAxis[0].removePlotLine).toHaveBeenCalledWith(CASES_PLOT_LINE_ID);
				expect(presentChart.yAxis[0].addPlotLine).toHaveBeenCalledWith(getCasesPlotLine(70));
			});
		});
	});
});
