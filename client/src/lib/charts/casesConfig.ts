import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getTotalCasesPer1000,
	type CasesAverted
} from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';
import type { Options, SeriesColumnOptions, SeriesLineOptions, PointOptionsObject } from 'highcharts';
import { getColumnFill, ScenarioToLabel } from './baseChart';
import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { getTotalCostsPerScenario } from '$lib/process-results/costs';
import { addBudgetPlotLine } from './strategyConfig';

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
			height: 450
		},
		title: {
			text: 'Clinical cases averted per 1,000 people per year'
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
				text: 'Cases averted'
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

interface CasesCompareDataPoint {
	scenario: Scenario;
	totalCases: number;
	totalCost: number;
}
export const createCasesCompareData = (
	cases: CasesData[],
	formValues: Record<string, FormValue>
): CasesCompareDataPoint[] => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	return scenarios
		.map((scenario) => {
			const scenarioCases = postInterventionCases[scenario];

			const totalCasesPer1000 = getTotalCasesPer1000(scenarioCases);
			return {
				scenario,
				totalCases: convertPer1000ToTotal(totalCasesPer1000, Number(formValues['population'])),
				totalCost: scenarioCosts[scenario]!
			};
		})
		.sort((a, b) => a.totalCost - b.totalCost);
};

export const createCasesCompareSeries = (
	cases: CasesData[],
	formValues: Record<string, FormValue>,
	name: 'Present' | 'Long term'
): SeriesLineOptions => ({
	name,
	type: 'line',
	data: createCasesCompareData(cases, formValues).map(({ totalCases, totalCost, scenario }) => ({
		x: totalCost,
		y: totalCases,
		custom: {
			intervention: ScenarioToLabel[scenario as Scenario]
		}
	})),
	color: name === 'Present' ? 'var(--chart-1)' : 'var(--chart-2)',
	step: 'left'
});

export const getCasesConfigCompare = (
	currentCases: CasesData[],
	newCases: CasesData[],
	formValues: Record<string, FormValue>
): Options => {
	const presentSeries = createCasesCompareSeries(currentCases, formValues, 'Present');
	const futureSeries = createCasesCompareSeries(newCases, formValues, 'Long term');

	const breakPoint = ((presentSeries.data!.at(1) as PointOptionsObject)?.x as number) ?? 0;
	return {
		chart: {
			type: 'line',
			height: 500,
			zooming: {
				type: 'x'
			},
			events: {
				click(event) {
					const clickedX = (event as Highcharts.ChartClickEventObject).xAxis[0].value;
					console.log(clickedX);
					// const xAxisValues = this.xAxis[0].categories ||
					// 	(this.series[0]?.data.map((point: any) => point.x) || []);
					// const closestX = xAxisValues.reduce((prev: number, curr: number) =>
					// 	Math.abs(curr - clickedX) < Math.abs(prev - clickedX) ? curr : prev
					// );
					// addBudgetPlotLine(this, closestX);
				}
			}
		},
		title: {
			text: '<span style="color:var(--chart-1);">Present</span> vs <span style="color:var(--chart-2);">Long term</span> - Cases vs Cost'
		},
		xAxis: {
			title: {
				text: 'Total Cost ($USD)'
			},
			labels: {
				format: '${value:,.0f}'
			},
			min: 0,
			tickPixelInterval: 10,
			breaks: [
				{
					from: 0,
					to: breakPoint * 0.9 // scale down the break size from the first data point,
				}
			]
		},
		yAxis: {
			title: {
				text: 'Total Cases'
			},
			labels: {
				format: '{value:,.0f}'
			}
		},
		tooltip: {
			shared: true,
			shadow: true,
			useHTML: true,
			headerFormat: 'Total Cost: <b/>${point.x:,.0f}</b>',
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
		series: [presentSeries, futureSeries],
		legend: {
			enabled: true
		}
	};
};
