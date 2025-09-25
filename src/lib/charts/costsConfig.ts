import type { CostCasesAndAverted } from '$lib/process-results/costs';
import { convertPer1000ToTotal, convertTotalToPer1000 } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import type { Options, SeriesColumnOptions, SeriesScatterOptions } from 'highcharts';
import { getColumnFill, ScenarioToColor, ScenarioToLabel } from './baseChart';

const createCostsPer1000Series = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
	population: number
): SeriesScatterOptions[] =>
	Object.entries(costsAndCasesAverted).map(([scenario, { totalCost, casesAverted }]) => ({
		name: ScenarioToLabel[scenario as Scenario],
		color: ScenarioToColor[scenario as Scenario],
		type: 'scatter',
		marker: { symbol: scenario.includes('lsm') ? 'diamond' : 'circle', radius: 6 },
		data: [[casesAverted.totalAvertedCasesPer1000, convertTotalToPer1000(totalCost, population)]]
	}));

const getCostPer1000Config = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
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
		pointFormat: 'Cases averted: <b>{point.x:.2f}</b><br/>Cost: <b>${point.y:,.2f}</b>'
	},
	series: createCostsPer1000Series(costsAndCasesAverted, population)
});

const getCostPerCaseSeries = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
	population: number
): SeriesColumnOptions[] => [
	{
		name: 'Cost',
		type: 'column',
		data: Object.entries(costsAndCasesAverted).map(([scenario, { totalCost, casesAverted }]) => ({
			name: ScenarioToLabel[scenario as Scenario],
			y: totalCost / convertPer1000ToTotal(casesAverted.totalAvertedCasesPer1000, population),
			color: getColumnFill(scenario as Scenario),
			dataLabels: {
				enabled: true,
				format: '${point.y:.2f}'
			}
		}))
	}
];

const getCostPerCaseConfig = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
	population: number
): Options => {
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
			categories: (Object.keys(costsAndCasesAverted) as Scenario[]).map((scenario) => ScenarioToLabel[scenario]),
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
		series: getCostPerCaseSeries(costsAndCasesAverted, population),
		plotOptions: {
			column: {
				groupPadding: 0.05
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			valueDecimals: 2,
			valuePrefix: '$'
		}
	};
};

export const getCostConfigs = (
	costsAndCasesAverted: Partial<Record<Scenario, CostCasesAndAverted>>,
	population: number
): { costPer1000Config: Options; costPerCaseConfig: Options } => ({
	costPer1000Config: getCostPer1000Config(costsAndCasesAverted, population),
	costPerCaseConfig: getCostPerCaseConfig(costsAndCasesAverted, population)
});
