import { MOCK_CASES_DATA, MOCK_COMPARE_PARAMETERS, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import BaselineCompare from '$routes/projects/[project]/regions/[region]/compare/_components/BaselineCompare.svelte';
import { render } from 'vitest-browser-svelte';

vi.mock('$lib/url', () => ({
	regionCompareUrl: vi.fn().mockReturnValue('http://test-emulator-url')
}));
describe('BaselineCompare component', () => {
	it('should render fields + present day charts initially', async () => {
		const screen = render(BaselineCompare, {
			props: {
				presentResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA,
					eirValid: true
				},
				compareBaselineParameters: MOCK_COMPARE_PARAMETERS.baselineParameters.map((param) => ({
					...param,
					value: 50
				})),
				chartTheme: 'highcharts-dark',
				formValues: MOCK_FORM_VALUES
			}
		} as any);

		await expect
			.element(screen.getByRole('radio', { name: MOCK_COMPARE_PARAMETERS.baselineParameters[0].label }))
			.toBeVisible();
		await expect
			.element(screen.getByRole('radio', { name: MOCK_COMPARE_PARAMETERS.baselineParameters[1].label }))
			.toBeVisible();
		await expect.element(screen.getByRole('slider')).toBeInTheDocument();
		await expect.element(screen.getByText('50%').first()).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'prevalence compare graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'cases compare graph' })).toBeVisible();
	});
});
