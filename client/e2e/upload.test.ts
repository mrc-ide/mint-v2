import { expect, test } from '@playwright/test';
import { goto, randomProjectName, uploadProjectCsv } from './utils';

// "coast" sets its intervention options, "nyanza" leaves everything but the baseline blank
const CSV = [
	'Region,Size of population at risk,Recent malaria prevalence,Expected ITN population usage,ITN types,Continuous distribution of ITNs',
	'coast,50000,35,70,py_only|py_pyrrole,false',
	'nyanza,120000,45,,,',
	''
].join('\n');

test.describe('Upload project CSV', () => {
	test.beforeEach(async ({ page }) => {
		await goto(page, '/');
	});

	test('can download the CSV template', async ({ page }) => {
		await page.getByRole('button', { name: 'Upload Project' }).click();

		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.getByRole('link', { name: 'Download the CSV template' }).click()
		]);

		expect(download.suggestedFilename()).toBe('mint-project-template.csv');
	});

	test('creates a project whose regions have already been run', async ({ page }) => {
		const projectName = randomProjectName();

		await uploadProjectCsv(page, projectName, CSV);

		await expect(page.getByText(`Project "${projectName}" created with 2 regions!`)).toBeVisible();
		await page.getByRole('button', { name: `Toggle ${projectName}` }).click();
		await page.getByRole('link', { name: 'coast' }).click();

		// the emulator has already been run, so the results are shown instead of the run button
		await expect(page.getByRole('region', { name: 'Impact prevalence graph' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Run baseline' })).toBeHidden();
	});

	test('runs the interventions set in the CSV, and only those', async ({ page }) => {
		const projectName = randomProjectName();

		await uploadProjectCsv(page, projectName, CSV);
		await expect(page.getByText(`Project "${projectName}" created with 2 regions!`)).toBeVisible();

		// "coast" asked for two types of ITN at 70% usage, without continuous distribution
		await goto(page, `/projects/${projectName}/regions/coast`);
		await expect(page.getByRole('button', { name: 'Show Pyrethroid ITN (Only)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid-Pyrrole ITN (Only)' })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: 'Pyrethroid-only ITNs' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Pyrethroid-pyrrole ITNs' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Pyrethroid-PBO ITNs' })).not.toBeChecked();
		await expect(page.getByRole('switch', { name: 'Continuous distribution of' })).not.toBeChecked();

		// "nyanza" left the interventions blank, so it was run with the defaults - baseline only
		await goto(page, `/projects/${projectName}/regions/nyanza`);
		await expect(page.getByRole('button', { name: 'Show No Intervention' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Pyrethroid ITN (Only)' })).toBeHidden();
	});

	test('reports the problems in a CSV without creating the project', async ({ page }) => {
		const projectName = randomProjectName();

		await uploadProjectCsv(page, projectName, 'Region,Size of population at risk\ncoast,lots\n');

		await expect(page.getByText('Row 2: "Size of population at risk" must be a number, but is "lots".')).toBeVisible();
		await expect(page.getByRole('button', { name: `Toggle ${projectName}` })).toBeHidden();
	});
});
