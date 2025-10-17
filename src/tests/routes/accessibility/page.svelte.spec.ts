import Page from '$routes/accessibility/+page.svelte';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

describe('/accessibility/+page.svelte', () => {
	it('should render accessibility page', async () => {
		const screen = render(Page);
		await expect.element(screen.getByText(/accessibility on mint/i)).toBeVisible();
	});
});
