import { ScenarioToLabel } from '$lib/charts/baseChart';
import type { StrategiseResults } from '$lib/types/userState';
import InterventionGrid from '$routes/projects/[project]/strategise/_components/InterventionGrid.svelte';
import { render } from 'vitest-browser-svelte';

const strategiseResults: StrategiseResults = [
	{
		costThreshold: 100,
		interventions: [
			{ region: 'Region A', intervention: 'irs_only', cost: 100, casesAverted: 50 },
			{ region: 'Region B', intervention: 'lsm_only', cost: 100, casesAverted: 80 }
		]
	},
	{
		costThreshold: 200,
		interventions: [
			{ region: 'Region A', intervention: 'irs_only', cost: 100, casesAverted: 50 },
			{ region: 'Region B', intervention: 'py_only_only', cost: 200, casesAverted: 120 }
		]
	},
	{
		costThreshold: 300,
		interventions: [
			{ region: 'Region A', intervention: 'lsm_only', cost: 200, casesAverted: 90 },
			{ region: 'Region B', intervention: 'py_only_only', cost: 200, casesAverted: 120 }
		]
	}
];

describe('InterventionGrid', () => {
	it('should render the heading', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, maxCost: 300 }
		} as any);

		await expect
			.element(screen.getByRole('heading', { name: 'Intervention Allocation by Cost of Strategy' }))
			.toBeVisible();
	});

	it('should render region labels', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, maxCost: 300 }
		} as any);

		await expect.element(screen.getByText('Region A')).toBeVisible();
		await expect.element(screen.getByText('Region B')).toBeVisible();
	});

	it('should render legend items for each unique intervention', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, maxCost: 300 }
		} as any);

		await expect.element(screen.getByText(ScenarioToLabel['irs_only'])).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['lsm_only'])).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['py_only_only'])).toBeVisible();
	});

	it('should render x-axis label', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, maxCost: 300 }
		} as any);

		await expect.element(screen.getByText('Total cost ($USD)')).toBeVisible();
	});

	it('should render x-axis tick for minCost and maxCost', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, maxCost: 300 }
		} as any);

		await expect.element(screen.getByText('$100')).toBeVisible();
		await expect.element(screen.getByText('$300')).toBeVisible();
	});

	it('should render with a single region', async () => {
		const singleRegionResults: StrategiseResults = [
			{
				costThreshold: 0,
				interventions: [{ region: 'Region A', intervention: 'no_intervention', cost: 0, casesAverted: 0 }]
			},
			{
				costThreshold: 500,
				interventions: [{ region: 'Region A', intervention: 'irs_only', cost: 500, casesAverted: 50 }]
			}
		];

		const screen = render(InterventionGrid, {
			props: { strategiseResults: singleRegionResults, minCost: 0, maxCost: 500 }
		} as any);

		await expect.element(screen.getByText('Region A')).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['no_intervention'])).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['irs_only'])).toBeVisible();
	});
});
