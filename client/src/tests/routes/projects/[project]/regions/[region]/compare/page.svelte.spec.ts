import { MOCK_COMPARE_PARAMETERS } from '$mocks/mocks';
import Page from '$routes/projects/[project]/regions/[region]/compare/+page.svelte';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';

vi.mock('$routes/projects/[project]/regions/[region]/compare/_components/Compare.svelte', async () => ({
	default: () =>
		render(
			createRawSnippet(() => ({
				render: () => '<div>baseline compare section</div>'
			}))
		)
}));
describe('Compare page', () => {
	it('should render if baseline has run & there is results', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						hasRunBaseline: true,
						results: { hi: 123 }
					},
					compareParameters: MOCK_COMPARE_PARAMETERS
				}
			}
		} as any);

		await expect.element(screen.getByText('baseline compare section')).toBeVisible();
		await expect.element(screen.getByText('Long term Scenario planning')).toBeVisible();
	});

	it('should show unavailable alert if baseline has not run or no results', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						hasRunBaseline: false,
						results: {}
					},
					compareParameters: {}
				}
			}
		} as any);
		await expect
			.element(screen.getByText('Run the region baseline to enable long term scenario planning.'))
			.toBeVisible();
	});
});
