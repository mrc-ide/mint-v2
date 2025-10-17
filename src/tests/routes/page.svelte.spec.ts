import { render } from 'vitest-browser-svelte';
import Page from '../../routes/+page.svelte';

describe('/+page.svelte', () => {
	it('should render base page', async () => {
		const screen = render(Page, {
			props: {
				data: { userData: { projects: [] }, form: {} }
			}
		} as any);

		await expect.element(screen.getByText(/malaria/i)).toBeVisible();
	});
});
