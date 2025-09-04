import type { Attachment } from 'svelte/attachments';
import type { PrevalenceData, Scenario } from './types/userState';
import Highcharts from 'highcharts';

// TODO: sort dark + light mode
export const createHighchart = (config: Highcharts.Options): Attachment => {
	return (element) => {
		const chart = Highcharts.chart(element as HTMLElement, config);

		return () => {
			chart.destroy();
		};
	};
};

export const ScenarioToLabel: Record<Scenario, string> = {
	no_intervention: 'No Intervention',
	irs_only: 'IRS Only',
	lsm_only: 'LSM Only',
	py_only_only: 'Pyrethroid ITN (Only)',
	py_only_with_lsm: 'Pyrethroid ITN (with LSM)',
	py_pbo_only: 'Pyrethroid-PBO (Only)',
	py_pbo_with_lsm: 'Pyrethroid-PBO (with LSM)',
	py_pyrrole_only: 'Pyrethroid-Pyrrole (Only)',
	py_pyrrole_with_lsm: 'Pyrethroid-Pyrrole (with LSM)',
	py_ppf_only: 'Pyrethroid-PPF (Only)',
	py_ppf_with_lsm: 'Pyrethroid-PPF (with LSM)'
};
export const ScenarioToColor: Record<Scenario, string> = {
	no_intervention: 'var(--muted-foreground)',
	irs_only: 'var(--chart-1)',
	lsm_only: 'var(--chart-2)',
	py_only_only: 'var(--chart-3)',
	py_only_with_lsm: 'var(--chart-3)',
	py_pbo_only: 'var(--chart-4)',
	py_pbo_with_lsm: 'var(--chart-4)',
	py_pyrrole_only: 'var(--chart-5)',
	py_pyrrole_with_lsm: 'var(--chart-5)',
	py_ppf_only: 'var(--chart-6)',
	py_ppf_with_lsm: 'var(--chart-6)'
};

export const PrevalenceScenarioSeriesOptions: Record<string, Highcharts.SeriesLineOptions> = {
	no_intervention: {
		type: 'line'
	},
	irs_only: {
		type: 'line',
		dashStyle: 'ShortDash'
	},
	lsm_only: {
		type: 'line',
		dashStyle: 'ShortDash'
	},
	py_only_only: {
		type: 'line'
	},
	py_only_with_lsm: {
		type: 'line',
		dashStyle: 'ShortDash'
	},
	py_pbo_only: {
		type: 'line'
	},
	py_pbo_with_lsm: {
		type: 'line',
		dashStyle: 'ShortDash'
	},
	py_pyrrole_only: {
		type: 'line'
	},
	py_pyrrole_with_lsm: {
		type: 'line',
		dashStyle: 'ShortDash'
	},
	py_ppf_only: {
		type: 'line'
	},
	py_ppf_with_lsm: {
		name: ScenarioToLabel['py_ppf_with_lsm'],
		color: ScenarioToColor['py_ppf_with_lsm'],
		type: 'line',
		dashStyle: 'ShortDash'
	}
};

const createPrevalenceSeries = (data: PrevalenceData[]): Highcharts.SeriesLineOptions[] => {
	const seriesMap = new Map<Scenario, Highcharts.SeriesLineOptions>();

	data.forEach(({ scenario, days, prevalence }) => {
		if (!seriesMap.has(scenario)) {
			seriesMap.set(scenario, {
				name: ScenarioToLabel[scenario],
				color: ScenarioToColor[scenario],
				data: [],
				...PrevalenceScenarioSeriesOptions[scenario]
			});
		}
		seriesMap.get(scenario)!.data!.push([days / 365 - 1, prevalence * 100]);
	});

	return Array.from(seriesMap.values());
};

export const getPrevalenceConfig = (prevalence: PrevalenceData[]): Highcharts.Options => ({
	chart: {
		type: 'line',
		zooming: {
			type: 'x'
		}
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
		headerFormat: '',
		valueSuffix: '%',
		valueDecimals: 1
	},

	series: createPrevalenceSeries(prevalence)
});
