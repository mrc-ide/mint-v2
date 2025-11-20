import Error from '$routes/+error.svelte';
import { render } from 'vitest-browser-svelte';

describe('Base error page', () => {
	it('should display the correct status code, messages, and buttons', async () => {
		const screen = render(Error);

		await expect.element(screen.getByText('An Error Occurred')).toBeVisible();
		await expect.element(screen.getByText('An unexpected error occurred.')).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Go Home' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Go Back' })).toBeVisible();
	});
});
