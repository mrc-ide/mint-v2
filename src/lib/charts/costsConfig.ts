import type { CasesAverted } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import { ScenarioToColor, ScenarioToLabel } from './baseChart';

export const createCostsPer1000Series = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): Highcharts.SeriesScatterOptions[] =>
	(Object.keys(casesAverted) as Scenario[])
		.filter((scenario) => casesAverted[scenario] && totalCosts[scenario] !== undefined) // safety check
		.map((scenario) => ({
			name: ScenarioToLabel[scenario],
			color: ScenarioToColor[scenario],
			type: 'scatter',
			marker: { symbol: scenario.includes('lsm') ? 'diamond' : 'circle', radius: 6 },
			data: [[casesAverted[scenario]!.totalAvertedCasesPer1000, (totalCosts[scenario]! / population) * 1000]]
		}));

export const getCostPer1000Config = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>,
	population: number
): Highcharts.Options => ({
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
