import { convertToLocaleString } from '$lib/number';
import Page from '$routes/projects/[project]/strategise/+page.svelte';
import { strategiseSchema } from '$routes/projects/[project]/strategise/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { render } from 'vitest-browser-svelte';

describe('+page.server.ts', () => {
	it('should render alert if cannot strategise', async () => {
		const screen = render(Page, {
			props: {
				data: {
					form: await superValidate(zod4(strategiseSchema)),
					project: { regions: [] },
					regionalStrategies: [
						{
							region: 'Region A',
							interventions: []
						}
					]
				}
			}
		} as any);

		await expect.element(screen.getByText('Strategise Tool Unavailable')).toBeVisible();
	});

	it('should allow budget input if can strategise', async () => {
		const minCost = 100;
		const maxCost = 500;
		const screen = render(Page, {
			props: {
				data: {
					form: await superValidate({ minCost, maxCost, budget: maxCost }, zod4(strategiseSchema)),
					project: { regions: [] },
					regionalStrategies: [
						{
							region: 'Region A',
							interventions: [
								{
									intervention: 'intervention_1',
									casesAverted: 100,
									cost: 500
								}
							]
						},
						{
							region: 'Region B',
							interventions: [
								{
									intervention: 'intervention_2',
									casesAverted: 150,
									cost: 800
								}
							]
						}
					]
				}
			}
		} as any);

		await expect.element(screen.getByRole('button')).toBeVisible();
		await expect.element(screen.getByLabelText(/budget/i)).toBeVisible();
		await expect.element(screen.getByText(convertToLocaleString(minCost, 0, 'ceil'))).toBeVisible();
		await expect.element(screen.getByText(convertToLocaleString(maxCost, 0, 'ceil'))).toBeVisible();
	});
});
