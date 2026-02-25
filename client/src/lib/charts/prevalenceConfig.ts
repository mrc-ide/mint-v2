import { SCENARIOS, type PrevalenceData, type Scenario } from '$lib/types/userState';
import { ScenarioToColor, ScenarioToLabel, type ScenarioLabel } from './baseChart';

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

const BASE_OPTIONS: Partial<Highcharts.Options> = {
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
		symbolWidth: 22,
		itemStyle: {
			fontSize: '.75em'
		}
	},
	plotOptions: {
		series: {
			marker: {
				enabled: false
			}
		}
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
					text: 'Recent interventions',
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
	}
};
export const getPrevalenceConfig = (prevalence: PrevalenceData[]): Highcharts.Options => ({
	...BASE_OPTIONS,
	chart: {
		type: 'spline',
		height: 450
	},
	title: {
		text: 'Projected prevalence in under 5 year olds'
	},

	series: createPrevalenceSeries(prevalence)
});

const createComparisonSeries = (
	data: PrevalenceData[],
	selectedIntervention: ScenarioLabel,
	name: string
): Highcharts.SeriesSplineOptions[] =>
	createPrevalenceSeries(data)
		.filter((series) => series.name === selectedIntervention)
		.map((series) => ({
			...series,
			name,
			color: undefined,
			dashStyle: 'Solid'
		}));

export const getPrevalenceConfigCompare = (
	presentPrevalence: PrevalenceData[],
	baselineLongTermPrevalence: PrevalenceData[],
	fullLongTermPrevalence: PrevalenceData[],
	selectedIntervention: ScenarioLabel
): Highcharts.Options => {
	const series: Highcharts.SeriesSplineOptions[] = [
		{ data: presentPrevalence, name: 'Present' },
		{ data: baselineLongTermPrevalence, name: 'Long term (baseline only)' },
		{ data: fullLongTermPrevalence, name: 'Long term (baseline + control strategy)' }
	].flatMap(({ data, name }) => createComparisonSeries(data, selectedIntervention, name));

	return {
		...BASE_OPTIONS,
		chart: {
			type: 'spline',
			height: 500
		},
		title: {
			text: `Prevalence in under 5 year olds - <em>${selectedIntervention}</em>`
		},

		tooltip: {
			...BASE_OPTIONS.tooltip,
			shared: true
		},
		series
	};
};
