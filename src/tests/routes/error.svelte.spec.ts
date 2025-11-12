import Error from '$routes/+error.svelte';
import { render } from 'vitest-browser-svelte';

describe('base error page', () => {
	vi.mock(import('$app/state'), () => ({
		page: {
			status: 404,
			error: { message: 'Test error message' }
		} as any
	}));

	it('should display the correct status code, messages, and buttons', async () => {
		const screen = render(Error);

		await expect.element(screen.getByText('404')).toBeVisible();
		await expect.element(screen.getByText('Resource Not Found')).toBeVisible();
		await expect.element(screen.getByText('Test error message')).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Go Home' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Go Back' })).toBeVisible();
	});
});
