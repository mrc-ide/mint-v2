import { MOCK_CASES_DATA, MOCK_COMPARE_PARAMETERS, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import Compare from '$routes/projects/[project]/regions/[region]/compare/_components/Compare.svelte';
import { render } from 'vitest-browser-svelte';

vi.mock('$lib/url', () => ({
	regionCompareUrl: vi.fn(() => 'http://test-emulator-url')
}));
describe('Compare component', () => {
	it('should render fields + present day charts initially', async () => {
		const compareParameters = structuredClone(MOCK_COMPARE_PARAMETERS);
		const screen = render(Compare, {
			props: {
				presentResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				compareParameters: {
					...compareParameters,
					baselineParameters: compareParameters.baselineParameters.map((param) => ({
						...param,
						value: 50
					}))
				},
				chartTheme: 'highcharts-dark',
				regionFormValues: MOCK_FORM_VALUES
			}
		} as any);

		await expect
			.element(screen.getByRole('radio', { name: compareParameters.baselineParameters[0].label }))
			.toBeVisible();
		await expect
			.element(screen.getByRole('radio', { name: compareParameters.baselineParameters[1].label }))
			.toBeVisible();
		await expect.element(screen.getByRole('slider')).toBeInTheDocument();
		await expect.element(screen.getByText('50%').first()).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'cases compare graph' })).toBeVisible();
	});
});
