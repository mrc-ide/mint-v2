import Header from '$routes/_components/Header.svelte';
import { render } from 'vitest-browser-svelte';

describe('Header component', () => {
	vi.mock('$app/state', () => ({
		page: { params: { project: 'Test Project', region: 'Region 1' }, data: {} }
	}));
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

	it('should show users project and regions in dropdown if available', async () => {
		const screen = render(Header, {
			props: {
				userData: {
					projects: [
						{
							name: 'Test Project',
							regions: [{ name: 'Region 1' }, { name: 'Region 2' }]
						}
					]
				}
			}
		} as any);

		await screen.getByRole('button', { name: /region 1/i }).click();

		await expect.element(screen.getByRole('menuitem', { name: 'Region 1' })).toBeVisible();
		await expect.element(screen.getByRole('menuitem', { name: 'Region 2' })).toBeVisible();

		await expect.element(screen.getByRole('textbox')).toBeVisible();
		await expect.element(screen.getByText('Add Region')).toBeVisible();
	});
});
