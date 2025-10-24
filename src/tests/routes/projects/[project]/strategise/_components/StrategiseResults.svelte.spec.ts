import type { StrategiseResults } from '$lib/types/userState';
import StrategiseResultsComponent from '$routes/projects/[project]/strategise/_components/StrategiseResults.svelte';
import { render } from 'vitest-browser-svelte';

describe('StrategiseResults', () => {
	it('should render chart and selected strategy info', async () => {
		const populations = {
			'Region A': 1000,
			'Region B': 2000
		};
		const strategiseResults: StrategiseResults = [
			{
				costThreshold: 500,
				interventions: [
					{
						region: 'Region A',
						intervention: 'irs_only',
						cost: 400,
						casesAverted: 50
					},
					{
						region: 'Region B',
						intervention: 'lsm_only',
						cost: 300,
						casesAverted: 80
					}
				]
			},
			{
				costThreshold: 1000,
				interventions: [
					{
						region: 'Region A',
						intervention: 'py_only_only',
						cost: 400,
						casesAverted: 50
					},
					{
						region: 'Region B',
						intervention: 'py_ppf_only',
						cost: 600,
						casesAverted: 100
					}
				]
			}
		];

		const screen = render(StrategiseResultsComponent, {
			props: {
				strategiseResults,
				populations
			}
		} as any);

		await expect.element(screen.getByRole('heading', { name: 'Total Cases Averted vs Total' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Show Region A' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Show Region B' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Optimal Strategy for explored' })).toBeVisible();
	});
});
