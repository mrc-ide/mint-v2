import Page from '$routes/projects/[project]/regions/[region]/compare/+page.svelte';
import { render } from 'vitest-browser-svelte';

describe('Compare page', () => {
	it('should render if baseline has run', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						hasRunBaseline: true
					}
				}
			}
		} as any);

		await expect.element(screen.getByText('Long term Scenario planning')).toBeVisible();
	});

	it('should show unavailable alert if baseline has not run', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						hasRunBaseline: false
					}
				}
			}
		} as any);

		await expect
			.element(screen.getByText('Run the region baseline to enable long term scenario planning.'))
			.toBeVisible();
	});
});
