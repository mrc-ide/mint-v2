import type { StrategiseResults } from '$lib/types/userState';

export const getStrategiseSeries = (data: StrategiseResults[]): Highcharts.SeriesOptionsType[] => {
	const seriesMap = new Map<string, Highcharts.SeriesOptionsType>();

	data.forEach(({ costThreshold, interventions }) => {
		interventions.forEach(({ casesAverted, region, intervention }) => {
			if (!seriesMap.has(region)) {
				seriesMap.set(region, {
					name: region,
					data: [],
					type: 'area'
				});
			}
			seriesMap.get(region)!.data.push({
				x: costThreshold,
				y: casesAverted,
				intervention: intervention
			});
		});
	});
	return Array.from(seriesMap.values());
};

export const getStrategyConfig = (
	strategiseResults: StrategiseResults[],
	setStrategy: (strategy: StrategiseResults) => void
): Highcharts.Options => ({
	chart: {
		type: 'area',
		height: 450,
		events: {
			click: function (event: any) {
				const chart = this;
				const xValue = Math.round(event.xAxis[0].value);

				// Remove existing current budget plot line by id
				chart.xAxis[0].removePlotLine('current-budget');

				// Add new plot line at clicked position with unique id
				chart.xAxis[0].addPlotLine({
					id: 'current-budget',
					value: xValue,
					color: 'var(--foreground)',
					dashStyle: 'Dash',
					zIndex: 5,
					label: {
						text: 'Current budget',
						style: { color: 'var(--foreground)', fontWeight: '600' }
					}
				});

				setStrategy(
					strategiseResults.find((result) => result.costThreshold >= xValue) ??
						strategiseResults[strategiseResults.length - 1]
				);
			}
		}
	},
	title: {
		text: 'Total Cases Averted vs Total Cost'
	},
	xAxis: {
		title: {
			text: 'Total Cost (USD)'
		},

		labels: {
			format: '${value:,.0f}'
		},
		plotLines: [
			{
				value: strategiseResults[0]?.costThreshold ?? 0,

				dashStyle: 'Dash',
				label: {
					text: 'Minimum cost-effective budget',
					style: { color: 'var(--muted-foreground)' }
				}
			},
			// {
			// 	value: 60,
			// 	color: 'blue',
			// 	label: {
			// 		text: 'Current budget',
			// 		align: 'left',
			// 		style: { color: 'blue' }
			// 	}
			// },
			{
				value: strategiseResults[strategiseResults.length - 1]?.costThreshold ?? 0,
				dashStyle: 'Dash',
				color: 'var(--primary)',

				label: {
					text: 'Maximum cost-effective budget',
					align: 'left',
					style: { color: 'var(--primary)' }
				}
			}
		]
	},
	yAxis: {
		title: {
			text: 'Total Cases Averted'
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
			'<div class="font-bold  pb-1 border-b">Cost: ${point.key:,.0f} | Cases Averted: {point.stackTotal:,.1f}</div>',
		pointFormat:
			'<div class="flex items-center"><span style="color:{point.color}" class="mr-1">●</span><span class="font-medium">{series.name}:</span> <span class="ml-0.5">{point.y:,.1f} cases ({point.intervention})</span></div>'
	},
	plotOptions: {
		area: {
			stacking: 'normal',
			marker: {
				enabled: false
			}
		},
		series: {
			point: {
				events: {
					click: function (event) {
						const xValue = Math.round(event.x);
						console.log(this.series.chart.xAxis[0].plotLinesAndBands);

						// Remove existing current budget plot line by id
						this.series.chart.xAxis[0].removePlotLine('current-budget');
						// Add new plot line at clicked position with unique id
						this.series.chart.xAxis[0].addPlotLine({
							id: 'current-budget',
							value: xValue,
							color: 'var(--foreground)',
							width: 2,
							zIndex: 5,
							label: {
								text: 'Current budget',
								align: 'left',
								style: { color: 'var(--foreground)' }
							}
						});
					}
				}
			}
		}
	},
	series: getStrategiseSeries(strategiseResults)
});
