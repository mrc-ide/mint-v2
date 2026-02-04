import { MOCK_CASES_DATA, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import BaselinePlots from '$routes/projects/[project]/regions/[region]/compare/_components/BaselinePlots.svelte';
import { render } from 'vitest-browser-svelte';

describe('BaselineCompare component', () => {
	it('should render graphs with present day results if no long term results', async () => {
		const screen = render(BaselinePlots, {
			props: {
				chartTheme: 'highcharts-dark',
				presentResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				}
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByText(/no intervention present/i)).toBeVisible();
		await expect.element(screen.getByText(/no intervention long term/i)).not.toBeInTheDocument();

		await expect.element(screen.getByText('cases graph')).toBeVisible();
	});

	it('should render graphs with long term results if available', async () => {
		const screen = render(BaselinePlots, {
			props: {
				chartTheme: 'highcharts-dark',
				presentResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				longTermResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				}
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByText(/no intervention present/i)).toBeVisible();
		await expect.element(screen.getByText(/no intervention long term/i)).toBeVisible();
	});
});
