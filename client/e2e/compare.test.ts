import { test, expect } from 'playwright/test';
import { changeSlider, createProject, goto, randomProjectName } from './utils';

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

		await expect(page.getByText('Long term Scenario planning')).toBeVisible();
	});

	test('can return from compare page to region page', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.getByRole('link', { name: 'Long term comparison' }).click();
		await page.getByRole('link', { name: 'Back to region' }).click();

		await expect(page.getByRole('button', { name: `${projectName} - nz` })).toBeVisible();
	});

	test('should compare prevalence & cases when sliders + inputs are adjusted', async ({ page }) => {
		await changeSlider(page, 'current_malaria_prevalence', 0.2);
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.waitForTimeout(500); // wait for chart to fully render
		await changeSlider(page, 'itn_future', 0.8);
		await page.getByRole('checkbox', { name: 'Pyrethroid-only ITNs' }).click();
		await page.getByRole('link', { name: 'Long term comparison' }).click();

		// adjust sliders
		await changeSlider(page, 'baseline-parameter-slider', 0.5);
		await changeSlider(page, 'itn_future-compare-slider', 0.7);
		await changeSlider(page, 'irs_future-compare-slider', 0.3);
		await changeSlider(page, 'lsm-compare-slider', 0.9);

		// adjust costs
		await page.getByLabel(/itn mass distribution/i).fill('3');
		await page.getByLabel(/estimated annual cost of irs/i).fill('15');
		await page.getByLabel(/estimated cost of lsm/i).fill('25');

		// prevalence plot
		await expect(page.getByRole('button', { name: 'Show No Intervention Long term' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show No Intervention Present' })).toBeVisible();
		// cases plot
		await expect(page.getByRole('button', { name: 'Show Long term' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Present' })).toBeVisible();
	});
});
