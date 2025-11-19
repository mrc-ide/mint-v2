import test, { expect, Page } from '@playwright/test';
import { changeSlider, createProject, goto, randomProjectName } from './utils';

const runRegionWithLSM = async (page: Page) => {
	await page.getByRole('button', { name: 'Run baseline' }).click();
	await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
	await page.waitForTimeout(500);
	await page.locator('#lsm').scrollIntoViewIfNeeded();
	await changeSlider(page, 'lsm', 0.8);
	await expect(page.getByRole('button', { name: 'Show LSM Only' })).toBeVisible();
};

test.describe('Strategise page', () => {
	const projectName = randomProjectName();
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
		await createProject(page, projectName);
	});

	test('should not be able to strategise without running interventions on multiple regions', async ({ page }) => {
		await goto(page, `/projects/${projectName}/regions/nz`);
		await runRegionWithLSM(page);

		await goto(page, `/projects/${projectName}/regions/australia`);
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();

		await page.getByRole('link', { name: 'Strategise across regions' }).click();
		await expect(page.getByRole('alert').getByText('Strategise Tool Unavailable')).toBeVisible();
	});

	test('should be able to strategise with multiple regions having interventions run', async ({ page }) => {
		await goto(page, `/projects/${projectName}/regions/nz`);
		await runRegionWithLSM(page);

		await goto(page, `/projects/${projectName}/regions/australia`);
		await runRegionWithLSM(page);

		await page.getByRole('link', { name: 'Strategise across regions' }).click();

		await page.getByRole('button', { name: 'Explore defined budget range' }).click();

		// chart visibility
		await expect(
			page.getByLabel('Interactive chart', { exact: true }).getByText('Total Cases Averted vs Total')
		).toBeVisible();

		// individual region cards
		await expect(page.getByText('Pop: 20,000 nz LSM Only Cost')).toBeVisible();
		await expect(page.getByText('Pop: 20,000 australia LSM Only Cost')).toBeVisible();
	});

	test("should wipe strategise data when a region's interventions are re-run", async ({ page }) => {
		await goto(page, `/projects/${projectName}/regions/nz`);
		await runRegionWithLSM(page);

		await goto(page, `/projects/${projectName}/regions/australia`);
		await runRegionWithLSM(page);

		await page.getByRole('link', { name: 'Strategise across regions' }).click();
		await page.getByRole('button', { name: 'Explore defined budget range' }).click();

		// Verify strategise data is present
		await expect(
			page.getByLabel('Interactive chart', { exact: true }).getByText('Total Cases Averted vs Total')
		).toBeVisible();

		// Re-run interventions for uk region
		await goto(page, `/projects/${projectName}/regions/uk`);
		await runRegionWithLSM(page);

		// Go back to strategise page
		await page.getByRole('link', { name: 'Strategise across regions' }).click();

		await expect(
			page.getByLabel('Interactive chart', { exact: true }).getByText('Total Cases Averted vs Total')
		).toBeHidden();
	});
});
