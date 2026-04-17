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
const selectedStrategy = strategiseResults[1]; // Select the strategy with costThreshold 200
const populations = {
	'Region A': 1000,
	'Region B': 2000
};
describe('InterventionGrid', () => {
	it('should render the heading', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, budget: 300, selectedStrategy, selectStrategy: vi.fn(), populations }
		} as any);

		await expect
			.element(screen.getByRole('heading', { name: 'Intervention Allocation by Cost of Strategy' }))
			.toBeVisible();
	});

	it('should render region labels', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, budget: 300, selectedStrategy, selectStrategy: vi.fn(), populations }
		} as any);

		await expect.element(screen.getByText('Region A').first()).toBeVisible();
		await expect.element(screen.getByText('Region B').first()).toBeVisible();
	});

	it('should render legend items for each unique intervention', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, budget: 300, selectedStrategy, selectStrategy: vi.fn(), populations }
		} as any);

		await expect.element(screen.getByText(ScenarioToLabel['irs_only']).first()).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['lsm_only']).first()).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['py_only_only']).first()).toBeVisible();
	});

	it('should render x-axis label', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, budget: 300, selectedStrategy, selectStrategy: vi.fn(), populations }
		} as any);

		await expect.element(screen.getByText('Total cost ($USD)').first()).toBeVisible();
	});

	it('should render x-axis tick for minCost and budget', async () => {
		const screen = render(InterventionGrid, {
			props: { strategiseResults, minCost: 100, budget: 300, selectedStrategy, selectStrategy: vi.fn(), populations }
		} as any);

		await expect.element(screen.getByText('$100').first()).toBeVisible();
		await expect.element(screen.getByText('$300').first()).toBeVisible();
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
			props: {
				strategiseResults: singleRegionResults,
				minCost: 0,
				budget: 500,
				selectedStrategy,
				selectStrategy: vi.fn(),
				populations
			}
		} as any);

		await expect.element(screen.getByText('Region A').first()).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['no_intervention']).first()).toBeVisible();
		await expect.element(screen.getByText(ScenarioToLabel['irs_only']).first()).toBeVisible();
	});

	it('should show explored budget line and strategy summary after clicking the intervention grid', async () => {
		const selectStrategy = vi.fn();
		const screen = render(InterventionGrid, {
			strategiseResults,
			minCost: 0,
			budget: 1000,
			populations,
			selectedStrategy,
			selectStrategy
		} as any);

		await screen.getByRole('button', { name: 'click to select strategy based on budget' }).click();

		await expect.element(screen.getByText('Explored budget')).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Optimal strategy for selected budget' })).toBeVisible();
		expect(selectStrategy).toHaveBeenCalledTimes(1);
	});
});
