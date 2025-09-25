import type { CasesAverted } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import type { Options, SeriesColumnOptions, SeriesLineOptions } from 'highcharts';
import { getColumnFill, ScenarioToLabel } from './baseChart';

const getCasesSeriesData = (
	casesAverted: Partial<Record<Scenario, CasesAverted>>
): Array<SeriesLineOptions | SeriesColumnOptions> => {
	const scenarios = Object.keys(casesAverted) as Scenario[];

	return [
		{
			name: 'Mean',
			type: 'column',
			data: scenarios.map((scenario) => ({
				name: ScenarioToLabel[scenario],
				y: casesAverted[scenario]?.casesAvertedMeanPer1000,
				color: getColumnFill(scenario)
			}))
		},
		...scenarios.map((scenario, scenarioIndex) => ({
			name: ScenarioToLabel[scenario],
			type: 'line' as const,
			data: [
				{ x: scenarioIndex - 0.3, y: casesAverted[scenario]!.casesAvertedYear1Per1000, name: 'Year 1' },
				{ x: scenarioIndex, y: casesAverted[scenario]!.casesAvertedYear2Per1000, name: 'Year 2' },
				{ x: scenarioIndex + 0.3, y: casesAverted[scenario]!.casesAvertedYear3Per1000, name: 'Year 3' }
			],
			color: 'var(--foreground)',
			marker: {
				enabled: true,
				symbol: 'circle'
			},
			lineWidth: 2,
			dashStyle: 'Dash' as const
		}))
	];
};

export const getCasesConfig = (casesAverted: Partial<Record<Scenario, CasesAverted>>): Options => {
	const scenarios = Object.keys(casesAverted) as Scenario[];

	return {
		chart: {
			type: 'column',
			height: 500,
			spacingBottom: 30
		},
		title: {
			text: 'Clinical cases averted per 1000 people per year'
		},
		xAxis: {
			type: 'category',
			categories: scenarios.map((scenario) => ScenarioToLabel[scenario]),
			accessibility: {
				description: 'Intervention types'
			},
			labels: {
				padding: 8
			}
		},
		yAxis: {
			title: {
				text: ''
			}
		},
		series: getCasesSeriesData(casesAverted),
		plotOptions: {
			column: {
				groupPadding: 0.05
			},
			line: {
				tooltip: {
					headerFormat: '<span style="font-size: 10px">{series.name}</span><br/>',
					pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y:.1f}</b><br/>'
				}
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			valueDecimals: 1
		}
	};
};
