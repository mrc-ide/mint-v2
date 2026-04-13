import { convertToLocaleString } from '$lib/number';
import Page from '$routes/projects/[project]/strategise/+page.svelte';
import { strategiseSchema } from '$routes/projects/[project]/strategise/schema';
import { createRawSnippet } from 'svelte';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { render } from 'vitest-browser-svelte';

const strategiseResultsSnippet = createRawSnippet(() => ({
	render: () => '<div>strategise results</div>'
}));
const compareStrategiseResultsSnippet = createRawSnippet(() => ({
	render: () => '<div>compare strategise results</div>'
}));

vi.mock('$routes/projects/[project]/strategise/_components/CompareStrategiseResults.svelte', async () => ({
	default: vi.fn(() => render(compareStrategiseResultsSnippet))
}));
vi.mock('$routes/projects/[project]/strategise/_components/StrategiseResults.svelte', async () => ({
	default: vi.fn(() => render(strategiseResultsSnippet))
}));

describe('+page.server.ts', () => {
	const regionalStrategies = [
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
	];
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
					regionalStrategies: regionalStrategies
				}
			}
		} as any);

		await expect.element(screen.getByRole('button')).toBeVisible();
		await expect.element(screen.getByLabelText(/budget/i)).toBeVisible();
		await expect.element(screen.getByText(convertToLocaleString(minCost, 0, 'ceil'))).toBeVisible();
		await expect.element(screen.getByText(convertToLocaleString(maxCost, 0, 'ceil'))).toBeVisible();
	});

	it('should display strategise results when available', async () => {
		const minCost = 100;
		const maxCost = 500;
		const screen = render(Page, {
			props: {
				data: {
					form: await superValidate({ minCost, maxCost, budget: maxCost }, zod4(strategiseSchema)),
					project: {
						regions: [],
						strategy: {
							budget: maxCost,
							results: ['result1', 'result2']
						}
					},
					userData: { compareEnabled: false },
					regionalStrategies: regionalStrategies
				}
			}
		} as any);

		await expect.element(screen.getByText('strategise results')).toBeVisible();
	});

	it('should show tab and be able to see compare results if userData.compareEnabled is true & no compare results', async () => {
		const minCost = 100;
		const maxCost = 500;
		const screen = render(Page, {
			data: {
				form: await superValidate({ minCost, maxCost, budget: maxCost }, zod4(strategiseSchema)),
				project: {
					regions: [],
					strategy: {
						budget: maxCost,
						results: ['result1', 'result2']
					}
				},
				userData: { compareEnabled: true },
				regionalStrategies: regionalStrategies
			}
		} as any);

		await expect.element(screen.getByRole('tab', { name: 'Present' })).toBeVisible();
		const presentTab = screen.getByRole('tab', { name: 'Long-term' });
		await presentTab.click();

		await expect
			.element(
				screen.getByText('You must run long-term planning for at least two regions to see long-term strategies.')
			)
			.toBeInTheDocument();
	});

	it('should show compare results in long-term tab when userData.compareEnabled is true & compare results exist', async () => {
		const minCost = 100;
		const maxCost = 500;
		const screen = render(Page, {
			data: {
				form: await superValidate({ minCost, maxCost, budget: maxCost }, zod4(strategiseSchema)),
				project: {
					regions: [],
					strategy: {
						budget: maxCost,
						results: ['result1', 'result2']
					},
					compareStrategy: {
						results: ['compareResult1', 'compareResult2']
					}
				},
				userData: { compareEnabled: true },
				regionalStrategies: regionalStrategies
			}
		} as any);

		const longTermTab = screen.getByRole('tab', { name: 'Long-term' });
		await longTermTab.click();

		await expect.element(screen.getByText('compare strategise results')).toBeVisible();
	});
});
