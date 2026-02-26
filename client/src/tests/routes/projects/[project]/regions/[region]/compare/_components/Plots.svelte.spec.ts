import { MOCK_CASES_DATA, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import ComparePlots from '$routes/projects/[project]/regions/[region]/compare/_components/Plots.svelte';
import { render } from 'vitest-browser-svelte';

describe('Compare plots component', () => {
	it('should render graphs with present and long term results', async () => {
		const screen = render(ComparePlots, {
			props: {
				chartTheme: 'highcharts-dark',
				presentResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				fullLongTermResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				baselineLongTermResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				presentFormValues: MOCK_FORM_VALUES,
				longTermFormValues: MOCK_FORM_VALUES
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'cases compare graph' })).toBeVisible();

		const presentLegendLabels = screen.getByRole('button', { name: 'Show Present' }).all();
		const baselineLongTermLegendLabels = screen.getByRole('button', { name: 'Show Long Term (baseline only)' }).all();
		const fullLongTermLegendLabels = screen
			.getByRole('button', { name: 'Show Long Term (baseline + control strategy)' })
			.all();
		// cases + prevalence for each of the 3 series types
		for (let i = 0; i < 2; i++) {
			await expect.element(presentLegendLabels[i]).toBeVisible();
			await expect.element(baselineLongTermLegendLabels[i]).toBeVisible();
			await expect.element(fullLongTermLegendLabels[i]).toBeVisible();
		}
	});
});
