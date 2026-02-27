import { MOCK_CASES_DATA, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import ComparePlots from '$routes/projects/[project]/regions/[region]/compare/_components/CompareResults.svelte';
import { render } from 'vitest-browser-svelte';

describe('Compare CompareResults component', () => {
	it('should render graphs & table with present and long term results', async () => {
		const screen = render(ComparePlots, {
			props: {
				chartTheme: 'highcharts-dark',
				results: {
					present: {
						cases: MOCK_CASES_DATA,
						prevalence: MOCK_PREVALENCE_DATA,
						eirValid: true
					},
					fullLongTerm: {
						cases: MOCK_CASES_DATA,
						prevalence: MOCK_PREVALENCE_DATA,
						eirValid: true
					},
					baselineLongTerm: {
						cases: MOCK_CASES_DATA,
						prevalence: MOCK_PREVALENCE_DATA,
						eirValid: true
					}
				},
				formValues: {
					presentFormValues: MOCK_FORM_VALUES,
					longTermFormValues: MOCK_FORM_VALUES
				}
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'cases compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('table')).toBeVisible();

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
