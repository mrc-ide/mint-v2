import { SCENARIOS, type PrevalenceData, type Scenario } from '$lib/types/userState';
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

	// Ensure series are returned in the order of SCENARIOS constant
	return SCENARIOS.filter((scenario) => seriesMap.has(scenario)).map((scenario) => seriesMap.get(scenario)!);
};

export const getPrevalenceConfig = (prevalence: PrevalenceData[]): Highcharts.Options => ({
	chart: {
		type: 'spline',
		height: 450
	},
	title: {
		text: 'Projected prevalence in under 5 year olds'
	},
	xAxis: {
		title: {
			text: 'Years since new interventions'
		},
		tickPositions: [0, 1, 2, 3],
		plotBands: [
			{
				color: 'var(--muted)',
				from: -1,
				to: 0,
				label: {
					text: 'Previous interventions',
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
					text: 'New interventions',
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
		min: 0,
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
	legend: {
		symbolWidth: 22
	},
	series: createPrevalenceSeries(prevalence)
});

export const createPresentPrevalenceSeries = (prevalence: PrevalenceData[]): Highcharts.SeriesSplineOptions[] =>
	createPrevalenceSeries(prevalence).map((series) => ({
		...series,
		name: `${series.name} <em>Present</em>`,
		opacity: 0.4
	}));

export const getPrevalenceConfigCompare = (
	currentPrevalenceSeries: Highcharts.SeriesSplineOptions[],
	newPrevalence: PrevalenceData[]
): Highcharts.Options => {
	const newSeries: Highcharts.SeriesSplineOptions[] = createPrevalenceSeries(newPrevalence).map((series) => ({
		...series,
		name: `${series.name} <em>Long term</em>`
	}));

	return {
		chart: {
			type: 'spline',
			height: 500
		},
		title: {
			text: '<span style="opacity: 0.4;">Present</span> vs Long term - Prevalence in under 5 year olds'
		},
		xAxis: {
			title: {
				text: 'Years since new interventions'
			},
			tickPositions: [0, 1, 2, 3]
		},
		yAxis: {
			min: 0,
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
		legend: {
			symbolWidth: 22
		},
		series: [...currentPrevalenceSeries, ...newSeries]
	};
};
