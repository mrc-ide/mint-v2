import Loader from '$lib/components/Loader.svelte';
import Layout from '$routes/+layout.svelte';
import { render } from 'vitest-browser-svelte';

describe('Layout Route', () => {
	it('should render layout ', async () => {
		const screen = render(Layout, {
			props: {
				data: {
					children: Loader,
					userData: {
						projects: []
					}
				}
			}
		} as any);

		await expect.element(screen.getByRole('link', { name: 'MINT logo MINT' })).toBeVisible();
	});
});
