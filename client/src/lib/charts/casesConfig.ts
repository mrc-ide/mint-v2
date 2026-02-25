import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { getTotalCostsPerScenario } from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	getTotalCasesPer1000,
	type CasesAverted
} from '$lib/process-results/processCases';
import type { CasesData, Scenario } from '$lib/types/userState';
import type { Options, PointOptionsObject, SeriesColumnOptions, SeriesLineOptions } from 'highcharts';
import { getColumnFill, ScenarioToLabel, type ScenarioLabel } from './baseChart';
import { convertToLocaleString } from '$lib/number';

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
export const filterInefficientStrategies = (dataPoints: CasesCompareDataPoint[]): CasesCompareDataPoint[] => {
	const sortedByCost = [...dataPoints].sort((a, b) => a.totalCost - b.totalCost);
	return sortedByCost.reduce<CasesCompareDataPoint[]>((acc, current) => {
		const previous = acc[acc.length - 1];
		if (!previous || current.totalCases < previous.totalCases) {
			acc.push(current);
		}
		return acc;
	}, []);
};
export const createCasesCompareDataPoints = (
	cases: CasesData[],
	formValues: Record<string, FormValue>
): CasesCompareDataPoint[] => {
	const postInterventionCases = collectPostInterventionCases(cases);
	const scenarios = Object.entries(postInterventionCases)
		.filter(([_, scenarioCases]) => scenarioCases.length > 0)
		.map(([scenario]) => scenario as Scenario);
	const scenarioCosts = getTotalCostsPerScenario(scenarios, formValues);

	const casesByTotalCost = scenarios.map((scenario) => {
		const totalCasesPer1000 = getTotalCasesPer1000(postInterventionCases[scenario]);
		return {
			scenario,
			totalCases: convertPer1000ToTotal(totalCasesPer1000, Number(formValues['population'])),
			totalCost: scenarioCosts[scenario]!
		};
	});

	return filterInefficientStrategies(casesByTotalCost);
};

export const createCasesCompareSeries = (
	cases: CasesData[],
	formValues: Record<string, FormValue>,
	name: 'Present' | 'Long term (baseline + control strategy)' | 'Long term (baseline only)'
): SeriesLineOptions => ({
	name,
	type: 'line',
	data: createCasesCompareDataPoints(cases, formValues).map(({ totalCases, totalCost, scenario }) => ({
		x: totalCost,
		y: totalCases,
		custom: {
			intervention: ScenarioToLabel[scenario as Scenario]
		}
	})),
	step: 'left'
});

/**
 * The function creates an x-axis break to minimize the empty space between the first and second data points.
 * This is because the first point is always at x=0 (no intervention), and the second point can be far away, leading to a large empty space on the chart.
 */
export const createBreakToMinimizeEmptySpace = (
	data1: PointOptionsObject[],
	data2: PointOptionsObject[]
): Highcharts.XAxisBreaksOptions[] | undefined => {
	const getSecondPoint = (data: PointOptionsObject[]): number => (data.length > 1 ? (data[1].x as number) : Infinity);

	const data1Breakpoint = getSecondPoint(data1);
	const data2Breakpoint = getSecondPoint(data2);

	const breakPoint = Math.min(data1Breakpoint, data2Breakpoint) * 0.9; // set break point at 90%
	const breakSize = breakPoint * 0.2; // add a 20% buffer to ensure the break is visible

	return breakPoint !== Infinity ? [{ from: 0, to: breakPoint, breakSize }] : undefined;
};

const resetSeriesPointStates = (seriesList: Highcharts.Series[]) => {
	seriesList.forEach((s) => s.points.forEach((p) => p.setState('')));
};
export const createCompareTooltipHtml = function (this: Highcharts.Point): string {
	const currentIntervention: string = this.options.custom!.intervention;
	const tooltipLines: string[] = [`<div class="mb-1"><span class="font-semibold ">${currentIntervention}</span></div>`];

	for (const series of this.series.chart.series) {
		resetSeriesPointStates([series]);

		const point = series.points.find((p) => p.options.custom!.intervention === currentIntervention);
		if (!point) continue;

		point.setState('hover');
		tooltipLines.push(`
			<div class="flex items-center">
				<span style="color:${series.color};" class="mr-1">●</span>
				<span class="text-muted-foreground">${series.name}:</span>
				<span class="ml-0.5">${convertToLocaleString(point.y as number, 1)} cases • $${convertToLocaleString(point.x, 0)}</span>
			</div>
		`);
	}

	return tooltipLines.join('');
};

export const getCasesCompareConfig = (
	presentCases: CasesData[],
	fullLongTermCases: CasesData[],
	baselineLongTermCases: CasesData[],
	presentFormValues: Record<string, FormValue>,
	longTermFormValues: Record<string, FormValue>,
	setSelectedIntervention: (intervention: ScenarioLabel) => void
): Options => {
	const presentSeries = createCasesCompareSeries(presentCases, presentFormValues, 'Present');
	const baselineLongTermSeries = createCasesCompareSeries(
		baselineLongTermCases,
		presentFormValues,
		'Long term (baseline only)'
	);
	const fullLongTermSeries = createCasesCompareSeries(
		fullLongTermCases,
		longTermFormValues,
		'Long term (baseline + control strategy)'
	);
	const presentData = presentSeries.data as PointOptionsObject[];
	const fullLongTermData = fullLongTermSeries.data as PointOptionsObject[];
	return {
		chart: {
			type: 'line',
			height: 450,
			events: {
				click: function (event) {
					const xValue = Math.round((event as Highcharts.ChartClickEventObject).xAxis[0].value);
					console.log('Clicked x value:', xValue);
					const allPoints = this.series.reduce<Highcharts.Point[]>((acc, series) => [...acc, ...series.data], []);
					const closestPoint = allPoints.reduce<Highcharts.Point | null>((closest, point) => {
						if (closest === null) return point;
						console.log('point.x:', point.x, 'closest.x:', closest.x);
						return Math.abs((point.x as number) - xValue) < Math.abs((closest.x as number) - xValue) ? point : closest;
					}, null);
					console.log('Closest point:', closestPoint);

					if (closestPoint) setSelectedIntervention(closestPoint.options.custom!.intervention);
				}
			}
		},
		title: {
			text: 'Present vs Long term - Total Cases vs Total Cost'
		},
		subtitle: {
			text: 'Step lines indicate changes in intervention strategy as budget increases.',
			style: {
				color: 'var(--muted-foreground)'
			}
		},
		caption: {
			text: 'Click on any point to view prevalence across all timeframes for that intervention strategy',
			align: 'left',
			verticalAlign: 'bottom',
			style: {
				color: 'var(--muted-foreground)'
			}
		},
		xAxis: {
			title: { text: 'Total Cost ($USD)' },
			labels: { format: '${value:,.0f}' },
			min: 0,
			breaks: createBreakToMinimizeEmptySpace(presentData, fullLongTermData)
		},
		yAxis: {
			title: { text: 'Total Cases' },
			labels: { format: '{value:,.0f}' }
		},
		tooltip: {
			shadow: true,
			useHTML: true,
			formatter: createCompareTooltipHtml
		},
		plotOptions: {
			line: {
				states: {
					inactive: {
						enabled: false
					}
				},
				events: {
					mouseOut: function () {
						resetSeriesPointStates(this.chart.series);
					},
					click: function (event) {
						setSelectedIntervention(event.point.options.custom!.intervention);
					}
				}
			}
		},
		legend: { enabled: true },
		series: fullLongTermData.length ? [presentSeries, baselineLongTermSeries, fullLongTermSeries] : [presentSeries]
	};
};
