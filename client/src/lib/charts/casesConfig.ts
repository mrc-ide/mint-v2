import { convertToLocaleString } from '$lib/number';
import { type CasesAverted, type ScenarioTotals } from '$lib/process-results/processCases';
import type { CompareTotals } from '$lib/types/compare';
import type { Scenario } from '$lib/types/userState';
import { type Options, type PointOptionsObject, type SeriesColumnOptions, type SeriesLineOptions } from 'highcharts';
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

export const createCasesCompareSeries = (
	totalCasesAndCosts: Partial<Record<Scenario, ScenarioTotals>>,
	name:
		| 'Present (current control strategies)'
		| 'Long-term (adjusted control strategies)'
		| 'Long-term (current control strategies)'
): SeriesColumnOptions => ({
	name,
	type: 'column',
	data: Object.entries(totalCasesAndCosts).map(([scenario, { totalCases, totalCost }]) => ({
		name: ScenarioToLabel[scenario as Scenario],
		y: totalCases,
		dataLabels: {
			enabled: true,
			rotation: -90,
			inside: true,
			crop: false,
			format: `$${convertToLocaleString(totalCost, 0)}`
		}
	}))
});

export const getCasesCompareConfig = (
	{ presentTotals, baselineLongTermTotals, fullLongTermTotals }: CompareTotals,
	scenarios: Scenario[]
): Options => {
	const presentSeries = createCasesCompareSeries(presentTotals, 'Present (current control strategies)');
	const baselineLongTermSeries = createCasesCompareSeries(
		baselineLongTermTotals,
		'Long-term (current control strategies)'
	);
	const fullLongTermSeries = createCasesCompareSeries(fullLongTermTotals, 'Long-term (adjusted control strategies)');
	const fullLongTermData = fullLongTermSeries.data as PointOptionsObject[];

	return {
		chart: {
			type: 'column',
			height: 450
		},
		title: {
			text: 'Total Clinical Cases and Cost of Strategy'
		},
		xAxis: {
			type: 'category',
			categories: scenarios.map((scenario) => ScenarioToLabel[scenario]),
			crosshair: true,
			accessibility: {
				description: 'Intervention types'
			}
		},
		subtitle: {
			text: 'The number of cases is shown on the y-axis, and the cost of the strategy is shown in the data labels.',
			align: 'left',
			verticalAlign: 'bottom',
			style: {
				color: 'var(--muted-foreground)'
			}
		},
		yAxis: {
			title: { text: 'Total cases' },
			labels: { format: '{value:,.0f}' }
		},
		tooltip: {
			shared: true,
			valueDecimals: 1,
			style: {
				opacity: 0.8
			},
			headerFormat: '<span style="font-size: 10px; font-weight: bold;">Total Cases</span><br/>'
		},
		plotOptions: {
			column: {
				groupPadding: 0.15
			}
		},
		legend: { enabled: true },
		series: fullLongTermData.length ? [presentSeries, baselineLongTermSeries, fullLongTermSeries] : [presentSeries]
	};
};
