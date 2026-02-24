import Header from '$routes/_components/Header.svelte';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';

vi.mock(import('$app/navigation'), async (importOriginal) => ({
	...(await importOriginal()),
	goto: vi.fn()
}));
describe('Header component', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should render header with theme toggle and menu items', async () => {
		const screen = render(Header, {
			props: {
				userData: {
					projects: []
				}
			}
		} as any);

		await screen.getByRole('button', { name: /open header menu/i }).click();

		await expect.element(screen.getByRole('menuitem', { name: /privacy/i })).toBeVisible();
		await expect.element(screen.getByRole('menuitem', { name: /accessibility/i })).toBeVisible();
		await expect.element(screen.getByRole('menuitem', { name: /news/i })).toBeVisible();
		await expect.element(screen.getByLabelText(/long term planning/i)).toBeVisible();

		const themeToggle = screen.getByRole('button', { name: 'Toggle theme' });
		await expect.element(themeToggle).toBeVisible();
	});

	it("should call goto with '/privacy' when Privacy menu item is clicked", async () => {
		const mockGoto = vi.fn();
		vi.mocked(goto).mockImplementation(mockGoto);

		const screen = render(Header, {
			props: {
				userData: {
					projects: []
				},
				goto: mockGoto
			}
		} as any);

		await screen.getByRole('button', { name: /open header menu/i }).click();
		await screen.getByRole('menuitem', { name: /privacy/i }).click();

		expect(mockGoto).toHaveBeenCalledWith('/privacy');
	});

	it("should call goto with '/accessibility' when Accessibility menu item is clicked", async () => {
		const mockGoto = vi.fn();
		vi.mocked(goto).mockImplementation(mockGoto);

		const screen = render(Header, {
			props: {
				userData: {
					projects: []
				},
				goto: mockGoto
			}
		} as any);

		await screen.getByRole('button', { name: /open header menu/i }).click();
		await screen.getByRole('menuitem', { name: /accessibility/i }).click();

		expect(mockGoto).toHaveBeenCalledWith('/accessibility');
	});

	it('should call window.open with news URL when News menu item is clicked', async () => {
		const mockWindowOpen = vi.fn();
		window.open = mockWindowOpen;

		const screen = render(Header, {
			props: {
				userData: {
					projects: []
				}
			}
		} as any);

		await screen.getByRole('button', { name: /open header menu/i }).click();
		await screen.getByRole('menuitem', { name: /news/i }).click();

		expect(mockWindowOpen).toHaveBeenCalledWith('https://mrc-ide.github.io/mint-news/', '_blank');
	});

	it('should expect compare switch to be enabled when userState has compareEnabled set to true', async () => {
		const screen = render(Header, {
			props: {
				userData: {
					projects: [],
					compareEnabled: true
				}
			}
		} as any);

		await screen.getByRole('button', { name: /open header menu/i }).click();
		const compareSwitch = screen.getByRole('switch');
		await expect.element(compareSwitch).toBeChecked();
	});
});
