import { expect, Page } from '@playwright/test';

/**
 * Navigates to the given path and waits for the svelte app to fully hydrate page.
 * If we don't wait, events like clicks may not be registered.
 */
export const goto = async (page: Page, path: string, waitForStarted = true) => {
	await page.goto(path);
	if (waitForStarted) {
		await page.waitForSelector('body.started');
	}
};

export const randomProjectName = () => `project-${Math.random().toString(36).substring(5)}`;

export const createProject = async (page: Page, projectName: string) => {
	await page.getByRole('button', { name: 'Create Project' }).click();
	await page.getByRole('textbox', { name: 'Project Name' }).fill(projectName);
	await page.getByRole('textbox', { name: 'Project Name' }).press('Tab');
	await page.getByRole('textbox', { name: 'Regions regions' }).fill('nz');
	await page.getByRole('textbox', { name: 'Regions regions' }).press('Enter');
	await page.getByRole('textbox', { name: 'Regions regions' }).fill('australia');
	await page.getByRole('textbox', { name: 'Regions regions' }).press('Enter');
	await page.getByRole('textbox', { name: 'Regions regions' }).fill('uk');
	await page.getByRole('textbox', { name: 'Regions regions' }).press('Enter');
	await page.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(page.getByText('Project created successfully')).toBeVisible();
};

export const changeSlider = async (page: Page, inputId: string, targetPercent: number) => {
	const thumb = page.locator(`#${inputId}`).locator('[data-slot="slider-thumb"]');
	const track = page.locator(`#${inputId}`).locator('[data-slot="slider-track"]');

	const thumbBox = await thumb.boundingBox();
	const trackBox = await track.boundingBox();

	if (!thumbBox || !trackBox) {
		throw new Error('Could not get bounding box for slider thumb or track');
	}

	const startX = thumbBox.x + thumbBox.width / 2;
	const startY = thumbBox.y + thumbBox.height / 2;
	const endX = trackBox.x + trackBox.width * targetPercent; // Move to targetPercent of the track

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(endX, startY, { steps: 10 });
	await page.mouse.up();
};
