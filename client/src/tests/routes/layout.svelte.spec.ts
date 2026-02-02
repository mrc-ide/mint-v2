import Loader from '$lib/components/Loader.svelte';
import Layout from '$routes/+layout.svelte';
import { render } from 'vitest-browser-svelte';

describe('Layout Route', () => {
	it('should render layout with footer', async () => {
		const screen = render(Layout, {
			props: {
				data: {
					children: Loader,
					userData: {
						projects: []
					},
					versionInfo: {
						server: '1.0.0',
						minte: '2.0.0'
					}
				}
			}
		} as any);

		await expect.element(screen.getByRole('link', { name: 'MINT logo MINT' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'minte v2.0.0' })).toBeVisible();
	});
});
