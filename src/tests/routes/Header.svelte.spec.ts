import Header from '$routes/_components/Header.svelte';
import { render } from 'vitest-browser-svelte';

describe('Header component', () => {
	it('should render header with correct links', async () => {
		const screen = render(Header, {
			props: {
				userData: {
					projects: []
				}
			}
		} as any);

		await expect.element(screen.getByRole('link', { name: /privacy/i })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /accessibility/i })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /news/i })).toBeVisible();

		const themeToggle = screen.getByRole('button', { name: 'Toggle theme' });
		await expect.element(themeToggle).toBeVisible();
	});
});
