import CompareSelectedStrategies from '$routes/projects/[project]/strategise/_components/CompareSelectedStrategies.svelte';
import { render } from 'vitest-browser-svelte';

describe('CompareSelectedStrategies component', () => {
	it('should show message about click if no strategies selected', async () => {
		const screen = render(CompareSelectedStrategies, {
			presentStrategy: null,
			longTermStrategy: null
		});

		await expect
			.element(screen.getByText('Click either chart to compare the selected present and long-term strategies.'))
			.toBeVisible();
	});

	it('should show both strategies when results for both are present', async () => {
		const strategy = {
			costThreshold: 500,
			interventions: [
				{
					region: 'Region A',
					intervention: 'irs_only',
					cost: 400,
					cases: 50
				},
				{
					region: 'Region B',
					intervention: 'lsm_only',
					cost: 300,
					cases: 80
				}
			]
		};

		const screen = render(CompareSelectedStrategies, {
			presentStrategy: strategy,
			longTermStrategy: strategy
		} as any);

		await expect.element(screen.getByText('Difference in total cases')).toBeVisible();
		await expect.element(screen.getByText('Difference in total cost')).toBeVisible();
		await expect.element(screen.getByText('Present strategy')).toBeVisible();
		await expect.element(screen.getByText('Long-term strategy')).toBeVisible();
	});
});
