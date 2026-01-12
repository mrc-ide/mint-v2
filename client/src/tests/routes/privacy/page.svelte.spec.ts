import Page from '$routes/privacy/+page.svelte';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

describe('/privacy/+page.svelte', () => {
	it('should render privacy page', async () => {
		const screen = render(Page);

		await expect.element(screen.getByText(/privacy notice/i)).toBeVisible();
	});
});
