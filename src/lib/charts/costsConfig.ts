import type { CasesAverted } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import { getColumnColor, ScenarioToColor, ScenarioToLabel } from './baseChart';
import type { SeriesScatterOptions, SeriesColumnOptions, Options } from 'highcharts';

const createCostsPer1000Series = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): SeriesScatterOptions[] => {
	const scenarios = Object.keys(casesAverted) as Scenario[];

	return scenarios
		.filter((scenario) => casesAverted[scenario] && totalCosts[scenario]) // safety check
		.map((scenario) => ({
			name: ScenarioToLabel[scenario],
			color: ScenarioToColor[scenario],
			type: 'scatter',
			marker: { symbol: scenario.includes('lsm') ? 'diamond' : 'circle', radius: 6 },
			data: [[casesAverted[scenario]!.totalAvertedCasesPer1000, (totalCosts[scenario]! / population) * 1000]]
		}));
};

const getCostPer1000Config = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): Options => ({
	chart: {
		height: 500,
		type: 'scatter'
	},
	title: {
		text: 'Strategy cost over 3 years vs cases averted'
	},
	xAxis: {
		title: {
			text: 'Cases averted per 1,000 people over 3 years'
		}
	},
	yAxis: {
		title: {
			text: 'Costs per 1,000 people over 3 years (USD)'
		}
	},
	tooltip: {
		pointFormat: 'Cases averted: <b>{point.x:.1f}</b><br/>Cost: <b>${point.y:,.1f}</b>'
	},
	series: createCostsPer1000Series(totalCosts, casesAverted, population)
});

const getCostPerCaseSeries = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): SeriesColumnOptions[] => {
	const scenarios = Object.keys(casesAverted) as Scenario[];
	return [
		{
			name: 'Cost',
			type: 'column',
			data: scenarios
				.filter((scenario) => casesAverted[scenario] && totalCosts[scenario]) // safety check
				.map((scenario) => ({
					name: ScenarioToLabel[scenario],
					y: totalCosts[scenario]! / ((casesAverted[scenario]!.totalAvertedCasesPer1000 / 1000) * population),
					color: getColumnColor(scenario),
					dataLabels: {
						enabled: true,
						format: '${point.y:.1f}'
					}
				}))
		}
	];
};
const getCostPerCaseConfig = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): Options => {
	const scenarios = Object.keys(casesAverted) as Scenario[];

	return {
		chart: {
			type: 'column',
			height: 500,
			spacingBottom: 30
		},
		title: {
			text: 'Strategy costs per case averted'
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
				text: 'Cost per case averted (USD)'
			}
		},
		series: getCostPerCaseSeries(totalCosts, casesAverted, population),
		plotOptions: {
			column: {
				groupPadding: 0.05
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			valueDecimals: 1,
			valuePrefix: '$'
		}
	};
};

export const getCostConfigs = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): { costPer1000Config: Options; costPerCaseConfig: Options } => ({
	costPer1000Config: getCostPer1000Config(totalCosts, casesAverted, population),
	costPerCaseConfig: getCostPerCaseConfig(totalCosts, casesAverted, population)
});
