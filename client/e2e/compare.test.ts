import test from 'playwright/test';
import { createProject, goto, randomProjectName } from './utils';

test.describe('E2E Compare Page', () => {
	const projectName = randomProjectName();
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
		await createProject(page, projectName);
		await goto(page, `/projects/${projectName}/regions/nz`);
	});

	test('can navigate to compare page from region page if has run baseline', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();

		await page.getByRole('link', { name: 'Long term comparison' }).click();

		await page.getByText('Long term Scenario planning').isVisible();
	});

	test('can return from compare page to region page', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.getByRole('link', { name: 'Long term comparison' }).click();
		await page.getByRole('link', { name: 'Back to region' }).click();

		await page.getByRole('button', { name: `${projectName} - nz` }).isVisible();
	});
});
