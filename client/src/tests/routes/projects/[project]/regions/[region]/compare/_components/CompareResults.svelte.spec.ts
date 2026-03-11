import { MOCK_CASES_DATA, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import ComparePlots from '$routes/projects/[project]/regions/[region]/compare/_components/CompareResults.svelte';
import { render } from 'vitest-browser-svelte';

vi.mock('$routes/projects/[project]/regions/[region]/compare/utils', () => ({
	getScenariosFromTotals: vi.fn(() => ['no_intervention', 'irs_only'])
}));

const renderComponent = (props: any = {}) =>
	render(ComparePlots, {
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
			},
			isLoading: false,
			...props
		}
	} as any);

describe('Compare CompareResults component', () => {
	it('should render loading state when isLoading is true', async () => {
		const screen = renderComponent({ isLoading: true });

		await expect.element(screen.getByText('Loading...')).toBeVisible();
	});

	it('should render cases and prevalence graphs by default', async () => {
		const screen = renderComponent();

		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'cases compare graph' })).toBeVisible();

		const presentLegendLabels = screen.getByRole('button', { name: 'Show Present (current control strategies)' }).all();
		const baselineLongTermLegendLabels = screen
			.getByRole('button', { name: 'Show Long-term (current control strategies)' })
			.all();
		const fullLongTermLegendLabels = screen
			.getByRole('button', { name: 'Show Long-term (adjusted control strategies)' })
			.all();
		// cases + prevalence for each of the 3 series types
		for (let i = 0; i < 2; i++) {
			await expect.element(presentLegendLabels[i]).toBeVisible();
			await expect.element(baselineLongTermLegendLabels[i]).toBeVisible();
			await expect.element(fullLongTermLegendLabels[i]).toBeVisible();
		}
	});

	it("should show table view when 'Table' tab is selected", async () => {
		const screen = renderComponent();

		await screen.getByRole('tab', { name: 'Table' }).click();

		await expect.element(screen.getByRole('columnheader', { name: 'Intervention' })).toBeVisible();
		await expect
			.element(screen.getByRole('columnheader', { name: 'Present (current control strategies)' }))
			.toBeVisible();
		await expect
			.element(screen.getByRole('columnheader', { name: 'Long-term (current control strategies)' }))
			.toBeVisible();
		await expect
			.element(screen.getByRole('columnheader', { name: 'Long-term (adjusted control strategies)' }))
			.toBeVisible();
	});

	it('should show prevalence graph for specific intervention when selected in radio group', async () => {
		const screen = renderComponent();

		await expect
			.element(
				screen.getByRole('region', { name: 'prevalence compare graph' }).getByText('No Intervention', { exact: true })
			)
			.toBeVisible();

		await screen.getByRole('radio', { name: 'IRS Only' }).click();

		await expect
			.element(screen.getByRole('region', { name: 'prevalence compare graph' }).getByText('IRS Only', { exact: true }))
			.toBeVisible();
	});
});
