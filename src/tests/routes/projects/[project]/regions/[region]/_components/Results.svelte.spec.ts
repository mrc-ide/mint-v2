import { MOCK_CASES_DATA, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import Results from '$routes/projects/[project]/regions/[region]/_components/Results.svelte';
import { render } from 'vitest-browser-svelte';

describe('Results.svelte', () => {
	it('should render impact tab with charts and table', async () => {
		const screen = render(Results, {
			props: {
				emulatorResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA
				},
				form: MOCK_FORM_VALUES,
				activeTab: 'impact'
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'Impact results table' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'Impact cases graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
	});

	it('should render costs tab with charts and table', async () => {
		const screen = render(Results, {
			props: {
				emulatorResults: {
					cases: MOCK_CASES_DATA,
					prevalence: MOCK_PREVALENCE_DATA
				},
				form: MOCK_FORM_VALUES,
				activeTab: 'cost'
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'Cost per 1000 population graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'Cost per case graph' })).toBeVisible();
		await expect.element(screen.getByRole('region', { name: 'Cost results table' })).toBeVisible();
	});

	it('should not render table or cases chart when no cases averted', async () => {
		const screen = render(Results, {
			props: {
				emulatorResults: {
					cases: MOCK_CASES_DATA.filter((c) => c.scenario !== 'no_intervention'),
					prevalence: MOCK_PREVALENCE_DATA
				},
				form: MOCK_FORM_VALUES,
				activeTab: 'impact'
			}
		} as any);

		await expect.element(screen.getByRole('region', { name: 'Impact results table' })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('region', { name: 'Impact cases graph' })).not.toBeInTheDocument();
	});

	it('should not render costs tab when no cases averted', async () => {
		const screen = render(Results, {
			props: {
				emulatorResults: {
					cases: MOCK_CASES_DATA.filter((c) => c.scenario !== 'no_intervention'),
					prevalence: MOCK_PREVALENCE_DATA
				},
				form: MOCK_FORM_VALUES,
				activeTab: 'cost'
			}
		} as any);

		await expect.element(screen.getByText(/cost results are not available/i)).toBeVisible();
	});
});
