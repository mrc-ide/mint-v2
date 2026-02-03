import Page from '$routes/version/+page.svelte';
import { render } from 'vitest-browser-svelte';

describe('Version page', () => {
	it('should render version info', async () => {
		const screen = render(Page, {
			props: {
				data: {
					versionInfo: {
						server: '1.0.0',
						minte: '2.0.0'
					}
				}
			}
		} as any);

		await expect.element(screen.getByRole('link', { name: /MINTe v2.0.0/ })).toBeVisible();
		await expect.element(screen.getByText('API v1.0.0')).toBeVisible();
	});
});
