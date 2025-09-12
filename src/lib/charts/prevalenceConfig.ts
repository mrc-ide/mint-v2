import type { PrevalenceData, Scenario } from '$lib/types/userState';
import { ScenarioToColor, ScenarioToLabel } from './baseChart';

const createPrevalenceSeries = (data: PrevalenceData[]): Highcharts.SeriesSplineOptions[] => {
	const seriesMap = new Map<Scenario, Highcharts.SeriesSplineOptions>();

	data.forEach(({ scenario, days, prevalence }) => {
		if (!seriesMap.has(scenario)) {
			seriesMap.set(scenario, {
				name: ScenarioToLabel[scenario],
				color: ScenarioToColor[scenario],
				data: [],
				type: 'spline',
				...(scenario.includes('lsm') ? { dashStyle: 'Dash' } : {})
			});
		}
		seriesMap.get(scenario)!.data!.push([days / 365 - 1, prevalence * 100]);
	});

	return Array.from(seriesMap.values());
};

export const getPrevalenceConfig = (prevalence: PrevalenceData[]): Highcharts.Options => ({
	chart: {
		type: 'spline',
		height: 500
	},
	title: {
		text: 'Projected prevalence in under 5 year olds'
	},
	xAxis: {
		type: 'linear',
		title: {
			text: 'Years since intervention'
		},
		tickPositions: [0, 1, 2, 3],
		plotBands: [
			{
				color: 'var(--muted)',
				from: -1,
				to: 0,
				label: {
					text: 'Pre-Intervention',
					style: {
						color: 'var(--muted-foreground)'
					},
					y: 15,
					rotation: 0
				}
			}
		],
		plotLines: [
			{
				dashStyle: 'Dash',
				value: 0,
				label: {
					text: 'Post-Intervention',
					y: 15,
					rotation: 0,
					style: {
						color: 'var(--muted-foreground)'
					}
				}
			}
		]
	},
	plotOptions: {
		series: {
			marker: {
				enabled: false
			}
		}
	},
	yAxis: {
		title: {
			text: 'Prevalence (%)'
		},
		labels: {
			format: '{value}%'
		}
	},
	tooltip: {
		headerFormat: '{point.x:.2f} years <br/>',
		valueSuffix: '%',
		valueDecimals: 1
	},

	series: createPrevalenceSeries(prevalence)
});
