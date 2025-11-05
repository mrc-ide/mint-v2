import type { StrategiseResult, StrategiseResults } from '$lib/types/userState';
import { ScenarioToLabel } from './baseChart';

const BUDGET_PLOTLINE_ID = 'explored-budget';
const getBudgetPlotLine = (budget: number): Highcharts.AxisPlotLinesOptions => ({
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

const addBudgetPlotLine = (chart: Highcharts.Chart, budget: number) => {
	chart.xAxis[0].removePlotLine(BUDGET_PLOTLINE_ID);
	chart.xAxis[0].addPlotLine(getBudgetPlotLine(budget));
};

const findClosestStrategiseResult = (strategiseResults: StrategiseResults, xValue: number) =>
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
		text: 'Total Cases Averted vs Total Budget'
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
			text: 'Total budget ($USD)'
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
		enabled: true
	},
	series: getStrategiseSeries(strategiseResults)
});
