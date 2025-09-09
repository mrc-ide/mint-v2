import Highcharts from 'highcharts/esm/highcharts.js';
import 'highcharts/esm/modules/accessibility';
import 'highcharts/esm/modules/pattern-fill.js';
import type { Attachment } from 'svelte/attachments';
import type { Scenario } from '../types/userState';

export const configureHighcharts = () => {
	Highcharts.setOptions({
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
