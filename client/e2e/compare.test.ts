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
		const itnCostLabel = page.getByRole('spinbutton', { name: 'ITN mass distribution' });
		await itnCostLabel.scrollIntoViewIfNeeded();
		await itnCostLabel.fill('5');
		const irsCostLabel = page.getByRole('spinbutton', {
			name: 'Estimated annual cost of IRS product per household structure ($USD)'
		});
		await irsCostLabel.scrollIntoViewIfNeeded();
		await irsCostLabel.fill('10');
		const lsmCostLabel = page.getByRole('spinbutton', { name: 'Estimated cost of LSM' });
		await lsmCostLabel.scrollIntoViewIfNeeded();
		await lsmCostLabel.fill('20');

		// prevalence plot
		await expect(page.getByRole('button', { name: 'Show No Intervention Long term' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show No Intervention Present' })).toBeVisible();
		// cases plot
		await expect(page.getByRole('button', { name: 'Show Long term (baseline)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Long term (combined)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Present' })).toBeVisible();
	});
});
