import { expect, test } from '@playwright/test';
import { createProject, goto, randomProjectName } from './utils';

test.describe('Home page', () => {
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
	});

	test('can create project and delete it', async ({ page }) => {
		const projectName = randomProjectName();

		await createProject(page, projectName);

		// Verify project created
		await expect(page.getByRole('button', { name: `Toggle ${projectName}` })).toBeVisible();
		await page.getByRole('button', { name: `Toggle ${projectName}` }).click();
		await expect(page.getByRole('link', { name: 'nz' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'australia' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'uk' })).toBeVisible();

		// Delete project
		await page.getByRole('button', { name: 'delete' }).click();
		await page.getByRole('button', { name: 'Delete', exact: true }).click();
		await expect(page.getByText('Project deleted successfully')).toBeVisible();
	});

	test('can navigate to region page of project', async ({ page }) => {
		const projectName = randomProjectName();

		await createProject(page, projectName);

		await page.getByRole('button', { name: `Toggle ${projectName}` }).click();
		await page.getByRole('link', { name: 'nz' }).click();

		// Verify navigation to region page
		await expect(page).toHaveURL(new RegExp(`/projects/${projectName}/regions/nz`));
		await expect(page.getByRole('button', { name: `${projectName} - nz` })).toBeVisible();
	});

	test('should be able to toggle theme', async ({ page }) => {
		// Default theme is light in test
		// Ensure body has inline style setting color-scheme: light
		// Ensure <html> (base element) has inline style setting color-scheme: light
		await expect(page.locator('html')).toHaveAttribute('style', /color-scheme:\s*light/i);

		// Toggle to dark
		await page.getByRole('button', { name: 'Toggle theme' }).click();
		await expect(page.locator('html')).toHaveAttribute('style', /color-scheme:\s*dark/i);

		// Toggle back to light
		await page.getByRole('button', { name: 'Toggle theme' }).click();
		await expect(page.locator('html')).toHaveAttribute('style', /color-scheme:\s*light/i);
	});
});
