import type { CompareStrategiseResult } from '$lib/types/userState';
import CompareStrategiseResults from '$routes/projects/[project]/strategise/_components/CompareStrategiseResults.svelte';
import { render } from 'vitest-browser-svelte';

describe('CompareStrategiseResults component', () => {
	const strategiseResults: CompareStrategiseResult = [
		{
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
		},
		{
			costThreshold: 1000,
			interventions: [
				{
					region: 'Region A',
					intervention: 'py_only_only',
					cost: 400,
					cases: 50
				},
				{
					region: 'Region B',
					intervention: 'py_ppf_only',
					cost: 600,
					cases: 100
				}
			]
		}
	];
	it('should render both present and long term strategy results', async () => {
		const screen = render(CompareStrategiseResults, {
			results: {
				present: strategiseResults,
				longTerm: strategiseResults
			}
		});

		await expect
			.element(screen.getByRole('heading', { name: 'Total Clinical Cases and Cost of Strategy' }))
			.toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Present (current controls)' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Long-term (adjusted controls)' })).toBeVisible();
		await expect
			.element(screen.getByText('Click either chart to compare the selected present and long-term strategies.'))
			.toBeVisible();
	});
});
