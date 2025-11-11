import test, { expect } from 'playwright/test';
import { changeSlider, createProject, goto, randomProjectName } from './utils';

test.describe('Region page', () => {
	const projectName = randomProjectName();
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
		await createProject(page, projectName);
		await goto(page, `/projects/${projectName}/regions/nz`);
	});

	test('runs baseline form for region shows prevalence graph only', async ({ page }) => {
		await page.getByRole('spinbutton', { name: 'Size of population at risk' }).fill('50000');
		await page.getByRole('switch', { name: 'Is transmission seasonal?' }).click();
		await changeSlider(page, 'current_malaria_prevalence', 0.8); // Set ITN coverage to 80%

		await page.getByRole('button', { name: 'Run baseline' }).click();

		await expect(
			page.getByLabel('Interactive chart', { exact: true }).getByText('Projected prevalence in under')
		).toBeVisible();
		await expect(page.getByRole('button', { name: 'Intervention Options' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Cost Options' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show No Intervention' })).toBeVisible();
	});

	test('should be able to update intervention options and see updated chart with all interventions', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
		await page.waitForTimeout(500); // wait for chart to fully render

		// itn options
		await changeSlider(page, 'itn_future', 0.8);
		await page.getByRole('checkbox', { name: 'Pyrethroid-only ITNs' }).click();
		await page.getByRole('checkbox', { name: 'Pyrethroid-PBO ITNs' }).click();
		await page.getByRole('checkbox', { name: 'Pyrethroid-pyrrole ITNs' }).click();
		await page.getByRole('checkbox', { name: 'Pyrethroid-pyriproxyfen ITNs' }).click();
		await page.getByRole('switch', { name: 'Continuous distribution of' }).click();
		// irs & lsm options
		await changeSlider(page, 'irs_future', 0.6);
		await page.locator('#lsm').scrollIntoViewIfNeeded();
		await changeSlider(page, 'lsm', 0.4);

		// Verify that intervention chart toggle buttons are visible
		await expect(page.getByRole('button', { name: 'Show Pyrethroid ITN (Only)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-PPF (Only)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-PBO (Only)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-Pyrrole (Only)' })).toBeVisible();

		// irs & lsm toggle buttons
		await expect(page.getByRole('button', { name: 'Show IRS Only' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show LSM Only' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-PBO (with LSM)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-PPF (with LSM)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-Pyrrole (with' })).toBeVisible();
	});

	test('should show impact table + cost options after running baseline and intervention scenarios', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
		await page.locator('#lsm').scrollIntoViewIfNeeded();

		await changeSlider(page, 'lsm', 0.6);

		await expect(page.getByRole('region', { name: 'Impact cases graph' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Impact results table' })).toBeVisible();

		await page.getByRole('tab', { name: 'Cost' }).click();

		await expect(page.getByRole('region', { name: 'Cost per 1000 population graph' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Cost per case graph' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Cost results table' })).toBeVisible();
	});

	test('changing costs should update cost', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
		await page.locator('#lsm').scrollIntoViewIfNeeded();
		await changeSlider(page, 'lsm', 0.6);

		await page.getByRole('tab', { name: 'Cost' }).click();

		// check total cost in table, default value is 5
		await expect(page.getByRole('cell', { name: '$100,000' })).toBeVisible();

		// change lsm cost
		await page.getByRole('spinbutton', { name: 'Estimated cost of LSM' }).fill('100');
		// check updated total cost in table
		await expect(page.getByRole('cell', { name: '$2,000,000' })).toBeVisible();
	});

	test('can create another region from region page and navigate to it', async ({ page }) => {
		const newRegionName = 'test-region';
		await page.getByRole('button', { name: `${projectName} - nz` }).click();
		await page.getByRole('textbox').fill(newRegionName);
		await page.getByRole('button', { name: 'Add Region' }).click();

		await page.getByRole('button', { name: `${projectName} - ${newRegionName}` }).click();
	});
});
