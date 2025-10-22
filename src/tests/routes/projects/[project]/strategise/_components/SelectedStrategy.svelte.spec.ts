import SelectedStrategy from '$routes/projects/[project]/strategise/_components/SelectedStrategy.svelte';
import { render } from 'vitest-browser-svelte';

describe('SelectedStrategy component', () => {
	it('should render selected strategy details', async () => {
		const populations = {
			'Region A': 1000,
			'Region B': 2000
		};
		const selectedStrategy = {
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
		};

		const screen = render(SelectedStrategy, {
			props: {
				selectedStrategy,
				populations
			}
		} as any);

		// totals
		await expect.element(screen.getByRole('heading', { name: 'Total Cost', exact: true })).toBeVisible();
		await expect.element(screen.getByText('$700.00')).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Cases Averted', exact: true })).toBeVisible();
		await expect.element(screen.getByText('130')).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Cost per Case Averted' })).toBeVisible();
		await expect.element(screen.getByText('$5.38')).toBeVisible();
		// individual regions
		await expect.element(screen.getByRole('heading', { name: 'Region A' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Region B' })).toBeVisible();
		await expect.element(screen.getByText('IRS Only')).toBeVisible();
		await expect.element(screen.getByText('LSM Only')).toBeVisible();
		await expect.element(screen.getByText(populations['Region A'].toLocaleString())).toBeVisible();
		await expect.element(screen.getByText(populations['Region B'].toLocaleString())).toBeVisible();
	});
});
