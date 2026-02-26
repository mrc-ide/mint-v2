import { test, expect } from 'playwright/test';
import { changeSlider, createProject, goto, randomProjectName } from './utils';

test.describe('E2E Compare Page', () => {
	const projectName = randomProjectName();
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
		await page.getByRole('button', { name: 'open header menu' }).click();
		await page.getByRole('switch', { name: 'Long term planning' }).click();
		await page.locator('html').click();
		await createProject(page, projectName);
		await goto(page, `/projects/${projectName}/regions/nz`);
	});

	test('shows long term planning link only when switched on in header menu', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await expect(page.getByRole('link', { name: 'Long term planning' })).toBeVisible();

		// toggle off
		await page.getByRole('button', { name: 'open header menu' }).click();
		await page.getByRole('switch', { name: 'Long term planning' }).click();
		await page.locator('html').click();
		await expect(page.getByRole('link', { name: 'Long term planning' })).toBeHidden();
	});
	test('can navigate to compare page from region page if has run baseline', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();

		await page.getByRole('link', { name: 'Long term planning' }).click();

		await expect(page.getByText('Long term Scenario planning')).toBeVisible();
	});

	test('can return from compare page to region page', async ({ page }) => {
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.getByRole('link', { name: 'Long term planning' }).click();
		await page.getByRole('link', { name: 'Back to region' }).click();

		await expect(page.getByRole('button', { name: `${projectName} - nz` })).toBeVisible();
	});

	test('should compare prevalence & cases when sliders + inputs are adjusted', async ({ page }) => {
		await changeSlider(page, 'current_malaria_prevalence', 0.2);
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.waitForTimeout(500); // wait for chart to fully render
		await changeSlider(page, 'itn_future', 0.8);
		await page.getByRole('checkbox', { name: 'Pyrethroid-only ITNs' }).click();
		await page.getByRole('link', { name: 'Long term planning' }).click();

		// adjust sliders
		await changeSlider(page, 'baseline-parameter-slider', 0.5);
		await changeSlider(page, 'itn_future-compare-slider', 0.7);
		await changeSlider(page, 'irs_future-compare-slider', 0.3);
		await changeSlider(page, 'lsm-compare-slider', 0.9);
		// adjust costs
		await page.getByLabel(/itn mass distribution/i).fill('3');
		await page.getByLabel(/estimated annual cost of irs product/i).fill('15');
		await page.getByLabel(/estimated cost of lsm/i).fill('25');

		// prevalence plot
		const prevalencePlot = page.getByRole('region', { name: 'prevalence compare graph' });
		await expect(prevalencePlot).toBeVisible();
		await expect(prevalencePlot.getByRole('button', { name: 'Show Long term (baseline only)' })).toBeVisible();
		await expect(
			prevalencePlot.getByRole('button', { name: 'Show Long term (baseline + control strategy)' })
		).toBeVisible();
		await expect(prevalencePlot.getByRole('button', { name: 'Show Present' })).toBeVisible();
		// cases plot
		const casesPlot = page.getByRole('region', { name: 'cases compare graph' });
		await expect(casesPlot).toBeVisible();
		await expect(casesPlot.getByRole('button', { name: 'Show Long term (baseline only)' })).toBeVisible();
		await expect(casesPlot.getByRole('button', { name: 'Show Long term (baseline + control strategy)' })).toBeVisible();
		await expect(casesPlot.getByRole('button', { name: 'Show Present' })).toBeVisible();
	});

	test('should be able to click on cases plot and see prevalence plot for that intervention', async ({ page }) => {
		await changeSlider(page, 'current_malaria_prevalence', 0.2);
		await page.getByRole('button', { name: 'Run baseline' }).click();
		await page.waitForTimeout(500); // wait for chart to fully render
		await changeSlider(page, 'itn_future', 0.8);
		await page.getByRole('checkbox', { name: 'Pyrethroid-only ITNs' }).click();
		await page.getByRole('link', { name: 'Long term planning' }).click();

		// initial is no intervention plot
		await expect(page.getByText('Prevalence in under 5 year olds - No Intervention').first()).toBeVisible();

		// click on cases x value is 54 thousand something (exact value may change based on emulator result)
		await page.getByRole('img', { name: 'x, 54', exact: false }).click();

		await expect(
			page.getByLabel('prevalence compare graph').getByText('Pyrethroid ITN (Only)', { exact: true })
		).toBeVisible();
	});
});
