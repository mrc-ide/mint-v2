import Highcharts from 'highcharts/esm/highcharts.js';
import 'highcharts/esm/modules/accessibility';
import 'highcharts/esm/modules/pattern-fill.js';
import 'highcharts/esm/modules/exporting';
import 'highcharts/esm/modules/broken-axis.js';

import type { Attachment } from 'svelte/attachments';
import type { Scenario } from '../types/userState';
import { mode } from 'mode-watcher';

/**
 * Copied from Highcharts demo to add slanted lines to indicate axis breaks on axis with a break. See:
 * https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/axisbreak/break-visualized/
 */
export const setupAxisBreaks = (
	axis: Highcharts.Axis,
	brokenAxis: { hasBreaks: boolean; breakArray?: Highcharts.XAxisBreaksOptions[]; axis: Highcharts.Axis },
	path: [string, number, number][]
) => {
	const start = path[0];
	let x = start[1];
	let y = start[2];
	const breakArray = brokenAxis?.breakArray || [];

	breakArray.forEach((brk: Highcharts.XAxisBreaksOptions) => {
		// Skip breaks outside the view
		if (Number(brk.to) <= Number(axis.min) || Number(brk.from) >= Number(axis.max)) {
			return;
		}

		const isHorizontal = axis.horiz;

		if (isHorizontal) {
			x = axis.toPixels(Number(brk.to));
			path.splice(
				1,
				0,
				['L', x - 4, y], // stop
				['M', x - 9, y + 5],
				['L', x + 1, y - 5], // left slanted line
				['M', x - 1, y + 5],
				['L', x + 9, y - 5], // higher slanted line
				['M', x + 4, y]
			);
		} else {
			y = axis.toPixels(Number(brk.to));
			path.splice(
				1,
				0,
				['L', x, y - 4], // stop
				['M', x + 5, y - 9],
				['L', x - 5, y + 1], // lower slanted line
				['M', x + 5, y - 1],
				['L', x - 5, y + 9], // higher slanted line
				['M', x, y + 4]
			);
		}
	});

	return path;
};

export const configureHighcharts = () => {
	Highcharts.wrap(Highcharts.Axis.prototype, 'getLinePath', function (proceed, lineWidth) {
		// @ts-expect-error: 'this' context is the Axis instance, but TypeScript doesn't know that
		const axis = this; // eslint-disable-line @typescript-eslint/no-this-alias
		const { brokenAxis } = axis;
		const path = proceed.call(axis, lineWidth);
		return setupAxisBreaks(axis, brokenAxis, path);
	});
	Highcharts.setOptions({
		exporting: {
			buttons: {
				contextButton: {
					height: 18,
					width: 20,
					symbolSize: 10,
					symbolY: 9,
					symbolX: 11,
					symbolStrokeWidth: 2,
					symbolStroke: 'var(--muted-foreground)',
					symbolFill: 'var(--muted-foreground)',
					useHTML: true,
					theme: {
						fill: 'var(--background)',
						// @ts-expect-error: typeExportingButtonsOptionsObject missing r, states properties
						r: 3,
						states: {
							hover: {
								fill: 'var(--accent)'
							},
							select: {
								fill: 'var(--accent)'
							}
						}
					}
				}
			}
		},
		title: {
			style: {
				color: 'var(--foreground)'
			}
		},
		legend: {
			itemStyle: {
				color: 'var(--foreground)'
			},
			itemHoverStyle: {
				color: 'var(--foreground)'
			}
		},
		xAxis: {
			labels: {
				style: {
					color: 'var(--foreground)',
					fontSize: '12px'
				}
			},
			title: {
				style: {
					color: 'var(--foreground)'
				}
			},
			lineColor: 'var(--muted-foreground)',
			tickColor: 'var(--muted-foreground)'
		},
		yAxis: {
			labels: {
				style: {
					color: 'var(--foreground)',
					fontSize: '12px'
				}
			},
			title: {
				style: {
					color: 'var(--foreground)'
				}
			},
			gridLineColor: 'var(--accent)'
		},
		tooltip: {
			backgroundColor: 'var(--popover)',
			style: {
				color: 'var(--popover-foreground)'
			}
		},
		chart: {
			zooming: {
				type: 'xy',
				resetButton: {
					theme: {
						r: 5,
						style: {
							fontWeight: '600',
							fontSize: '12px'
						}
					}
				}
			},
			backgroundColor: 'var(--background)'
		},
		plotOptions: {
			series: {
				borderColor: 'var(--background)',
				borderWidth: 1
			}
		}
	});
};
export const createHighchart = (config: Highcharts.Options, onLoad?: () => void): Attachment => {
	return (element) => {
		const chart = Highcharts.chart(element as HTMLElement, config);
		onLoad?.();

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
	py_pbo_only: 'Pyrethroid-PBO ITN (Only)',
	py_pbo_with_lsm: 'Pyrethroid-PBO ITN (with LSM)',
	py_pyrrole_only: 'Pyrethroid-Pyrrole ITN (Only)',
	py_pyrrole_with_lsm: 'Pyrethroid-Pyrrole ITN (with LSM)',
	py_ppf_only: 'Pyrethroid-PPF ITN (Only)',
	py_ppf_with_lsm: 'Pyrethroid-PPF ITN (with LSM)'
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

export const getColumnFill = (scenario: Scenario): Highcharts.PatternObject => ({
	pattern: {
		color: ScenarioToColor[scenario],
		width: 10,
		height: 10,
		...(scenario.includes('lsm') && {
			path: {
				d: 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11'
			}
		})
	}
});

export const getChartTheme = () => (mode.current === 'dark' ? 'highcharts-dark' : 'highcharts-light');
