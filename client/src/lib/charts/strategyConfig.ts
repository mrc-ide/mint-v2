import { roundNumber } from '$lib/number';
import type {
	CompareStrategiseResult,
	CompareStrategiseResults,
	StrategiseResult,
	StrategiseResults
} from '$lib/types/userState';
import { ScenarioToLabel } from './baseChart';

export const BUDGET_PLOTLINE_ID = 'explored-budget';
export const getBudgetPlotLine = (budget: number): Highcharts.AxisPlotLinesOptions => ({
	id: BUDGET_PLOTLINE_ID,
	value: budget,
	color: 'var(--foreground)',
	dashStyle: 'ShortDot',
	width: 2,
	zIndex: 5,
	label: {
		text: 'Explored budget',
		style: { color: 'var(--foreground)', fontWeight: '600' }
	}
});
export const CASES_PLOT_LINE_ID = 'explored-cases';
export const getCasesPlotLine = (cases: number): Highcharts.AxisPlotLinesOptions => ({
	id: CASES_PLOT_LINE_ID,
	value: cases,
	color: 'var(--foreground)',
	dashStyle: 'ShortDot',
	width: 2,
	zIndex: 5,
	label: {
		text: 'Explored cases',
		style: { color: 'var(--foreground)', fontWeight: '600' }
	}
});

export const addBudgetPlotLine = (chart: Highcharts.Chart, budget: number) => {
	chart.xAxis[0].removePlotLine(BUDGET_PLOTLINE_ID);
	chart.xAxis[0].addPlotLine(getBudgetPlotLine(budget));
};
export const addCasesPlotLine = (chart: Highcharts.Chart, cases: number) => {
	chart.yAxis[0].removePlotLine(CASES_PLOT_LINE_ID);
	chart.yAxis[0].addPlotLine(getCasesPlotLine(cases));
};

export const findClosestStrategiseResult = (strategiseResults: StrategiseResults, xValue: number) =>
	strategiseResults.findLast((result) => result.costThreshold <= xValue) ?? strategiseResults[0];

export const getStrategiseSeries = (data: StrategiseResults): Highcharts.SeriesAreaOptions[] => {
	const seriesMap = new Map<string, Highcharts.SeriesAreaOptions>();

	data.forEach(({ costThreshold, interventions }) => {
		interventions.forEach(({ casesAverted, region, intervention }) => {
			if (!seriesMap.has(region)) {
				seriesMap.set(region, {
					name: region,
					data: [],
					type: 'area'
				});
			}
			seriesMap.get(region)!.data!.push({
				x: costThreshold,
				y: casesAverted,
				custom: {
					intervention: ScenarioToLabel[intervention]
				}
			});
		});
	});
	return Array.from(seriesMap.values());
};

export const getStrategyConfig = (
	strategiseResults: StrategiseResults,
	setStrategy: (strategy: StrategiseResult) => void
): Highcharts.Options => ({
	chart: {
		type: 'area',
		height: 450,
		zooming: {
			type: 'x'
		},
		events: {
			click: function (event) {
				const xValue = Math.round((event as Highcharts.ChartClickEventObject).xAxis[0].value);
				addBudgetPlotLine(this, xValue);
				setStrategy(findClosestStrategiseResult(strategiseResults, xValue));
			}
		}
	},
	title: {
		text: 'Total Clinical Cases Averted and Cost of Strategy'
	},
	subtitle: {
		text:
			'<b>Click anywhere on the chart to explore the optimal intervention strategy at the selected budget level.</b><br>' +
			'The chart displays strategies from the minimum cost option to the defined maximum available budget.',
		verticalAlign: 'bottom',
		align: 'left'
	},
	xAxis: {
		title: {
			text: 'Total cost ($USD)'
		},

		labels: {
			format: '${value:,.0f}'
		},
		plotLines: [
			{
				value: strategiseResults[0]?.costThreshold ?? 0,
				dashStyle: 'Dash',
				zIndex: 5,
				label: {
					text: 'Minimum budget',
					style: { color: 'var(--muted-foreground)' }
				}
			},
			getBudgetPlotLine(strategiseResults[strategiseResults.length - 1].costThreshold)
		]
	},
	yAxis: {
		title: {
			text: 'Total cases averted'
		},
		labels: {
			format: '{value:,.1f}'
		}
	},
	tooltip: {
		shared: true,
		shadow: true,
		useHTML: true,
		headerFormat:
			'<div class="font-bold  pb-1 border-b">Budget: ${point.key:,.0f} | Cases Averted: {point.stackTotal:,.1f}</div>',
		pointFormat: `<div class="flex items-center">
			    <span style="color:{point.color}" class="mr-1">●</span>
			    <span class="font-medium">{series.name}:</span>
			    <span class="ml-0.5">{point.y:,.1f} cases
			        <span class="text-muted-foreground">
			            {point.custom.intervention}
			        </span>
			    </span>
			</div>`
	},
	plotOptions: {
		area: {
			stacking: 'normal',
			marker: {
				enabled: false
			},
			events: {
				click: function (event) {
					addBudgetPlotLine(this.chart, event.point.x);
					setStrategy(findClosestStrategiseResult(strategiseResults, event.point.x));
				}
			}
		}
	},
	legend: {
		enabled: true,
		events: {
			itemClick: () => false
		}
	},
	series: getStrategiseSeries(strategiseResults)
});

/******* Compare Strategise Config  *******************/

export const getCompareStrategiseSeries = (data: CompareStrategiseResult): Highcharts.SeriesAreaOptions[] => {
	const seriesMap = new Map<string, Highcharts.SeriesAreaOptions>();

	data.forEach(({ costThreshold, interventions }) => {
		interventions.forEach(({ cases, region, intervention }) => {
			if (!seriesMap.has(region)) {
				seriesMap.set(region, {
					name: region,
					data: [],
					type: 'area'
				});
			}
			seriesMap.get(region)!.data!.push({
				x: costThreshold,
				y: cases,
				custom: {
					intervention: ScenarioToLabel[intervention]
				}
			});
		});
	});
	return Array.from(seriesMap.values());
};

export const getClosestPoint = (cost: number, allSeries: Highcharts.Series[]): Highcharts.Point | null =>
	allSeries
		.flatMap((series) => series.data)
		.reduce<Highcharts.Point | null>((closest, point) => {
			if (closest === null) return point;
			return Math.abs((point.x as number) - cost) < Math.abs((closest.x as number) - cost) ? point : closest;
		}, null);

export const getCompareStrategyConfig = (
	compareResult: CompareStrategiseResult,
	name: 'Present (current controls)' | 'Long-term (adjusted controls)',
	maxCases: number,
	onCasesPlotLineAdded: (cases: number) => void
): Highcharts.Options => ({
	chart: {
		type: 'area',
		height: 500,
		zooming: {
			type: 'x'
		},
		events: {
			click: function (event) {
				const xValue = Math.round((event as Highcharts.ChartClickEventObject).xAxis[0].value);
				const closestPoint = getClosestPoint(xValue, this.series);
				if (closestPoint) {
					addCasesPlotLine(this, closestPoint.total!);
					onCasesPlotLineAdded(closestPoint.total!);
				}
			}
		}
	},
	title: {
		text: name
	},

	xAxis: {
		title: {
			text: 'Total cost ($USD)'
		},

		labels: {
			format: '${value:,.0f}'
		}
	},
	yAxis: {
		title: {
			text: 'Total cases'
		},
		labels: {
			format: '{value:,.1f}'
		},
		max: maxCases * 1.1 // add 10% padding to max cases for better visualization of plot line
	},
	tooltip: {
		shared: true,
		shadow: true,
		useHTML: true,
		headerFormat:
			'<div class="font-bold  pb-1 border-b">Budget: ${point.key:,.0f} | Cases: {point.stackTotal:,.1f}</div>',
		pointFormat: `<div class="flex items-center">
			    <span style="color:{point.color}" class="mr-1">●</span>
			    <span class="font-medium">{series.name}:</span>
			    <span class="ml-0.5">{point.y:,.1f} cases
			        <span class="text-muted-foreground">
			            {point.custom.intervention}
			        </span>
			    </span>
			</div>`
	},
	plotOptions: {
		area: {
			stacking: 'normal',
			marker: {
				enabled: false
			},
			events: {
				click: function (event) {
					addCasesPlotLine(this.chart, event.point.total!);
					onCasesPlotLineAdded(event.point.total!);
				}
			}
		}
	},
	legend: {
		enabled: true,
		events: {
			itemClick: () => false
		}
	},
	series: getCompareStrategiseSeries(compareResult)
});

const calculateTotalCasesMinCost = (data: CompareStrategiseResult): number =>
	data[0]?.interventions.reduce((sum, intervention) => sum + intervention.cases, 0) ?? 0;

const calculateTotalRoundedCases = (strategy: CompareStrategiseResult[number]) =>
	roundNumber(strategy.interventions.reduce((sum, intervention) => sum + intervention.cases, 0));

const findExactCaseMatch = (strategies: CompareStrategiseResult, cases: number) =>
	strategies.find((strategy) => calculateTotalRoundedCases(strategy) === roundNumber(cases)) ?? null;

const findLessThanOrEqualCaseMatch = (strategies: CompareStrategiseResult, cases: number) =>
	strategies.find((strategy) => calculateTotalRoundedCases(strategy) <= roundNumber(cases)) ?? null;

export const getCompareStrategyConfigs = (
	{ present, longTerm }: NonNullable<CompareStrategiseResults>,
	getCharts: () => { presentChart: Highcharts.Chart | null; longTermChart: Highcharts.Chart | null },
	selectedStrategies: {
		presentStrategy: null | CompareStrategiseResult[number];
		longTermStrategy: null | CompareStrategiseResult[number];
	}
) => {
	const maxCases = Math.max(calculateTotalCasesMinCost(present), calculateTotalCasesMinCost(longTerm));
	return {
		presentConfig: getCompareStrategyConfig(present, 'Present (current controls)', maxCases, (cases) => {
			const { longTermChart } = getCharts();
			selectedStrategies.presentStrategy = findExactCaseMatch(present, cases);
			selectedStrategies.longTermStrategy = findLessThanOrEqualCaseMatch(longTerm, cases);

			if (longTermChart) addCasesPlotLine(longTermChart, cases);
		}),
		longTermConfig: getCompareStrategyConfig(longTerm, 'Long-term (adjusted controls)', maxCases, (cases) => {
			const { presentChart } = getCharts();

			selectedStrategies.longTermStrategy = findExactCaseMatch(longTerm, cases);
			selectedStrategies.presentStrategy = findLessThanOrEqualCaseMatch(present, cases);

			if (presentChart) addCasesPlotLine(presentChart, cases);
		})
	};
};
