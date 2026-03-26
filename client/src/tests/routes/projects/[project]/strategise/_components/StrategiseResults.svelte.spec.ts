import type { StrategiseResults } from '$lib/types/userState';
import StrategiseResultsComponent from '$routes/projects/[project]/strategise/_components/StrategiseResults.svelte';
import { render } from 'vitest-browser-svelte';

describe('StrategiseResults', () => {
	const populations = {
		'Region A': 1000,
		'Region B': 2000
	};
	const minCost = 100;
	const maxCost = 1000;
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
	it('should render chart and selected strategy info', async () => {
		const screen = render(StrategiseResultsComponent, {
			props: {
				strategiseResults,
				populations,
				minCost,
				maxCost
			}
		} as any);

		await expect.element(screen.getByRole('heading', { name: 'Total Clinical Cases Averted' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Show Region A' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Show Region B' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Optimal Strategy for selected' })).toBeVisible();
	});

	it('should be able to switch tabs to display intervention grid', async () => {
		const screen = render(StrategiseResultsComponent, {
			props: {
				strategiseResults,
				populations,
				minCost,
				maxCost
			}
		} as any);

		await expect.element(screen.getByRole('tab', { name: 'Cases Averted Chart' })).toBeVisible();

		await screen.getByRole('tab', { name: 'Allocation Grid' }).click();

		await expect.element(screen.getByText('Intervention Allocation by Cost of Strategy')).toBeInTheDocument();
	});
});
