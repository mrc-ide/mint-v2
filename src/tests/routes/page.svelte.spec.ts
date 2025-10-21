import { testWithWorker } from '$root/test-extend';
import { render } from 'vitest-browser-svelte';
import Page from '../../routes/+page.svelte';
import { userEvent } from '@vitest/browser/context';
import { http, HttpResponse } from 'msw';
import { superValidate } from 'sveltekit-superforms';
import { createProjectSchema } from '$routes/schema';
import { zod } from 'sveltekit-superforms/adapters';

describe('/+page.svelte', () => {
	it('should render base page with project info', async () => {
		const screen = render(Page, {
			props: {
				data: {
					userData: {
						projects: [
							{ name: 'Europe', regions: [] },
							{ name: 'Asia', regions: [] }
						]
					},
					form: {}
				}
			}
		} as any);

		await expect.element(screen.getByText(/europe/i)).toBeVisible();
		await expect.element(screen.getByText(/asia/i)).toBeVisible();
		await expect.element(screen.getByText(/you have 2 projects/i)).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /create project/i })).toBeVisible();
	});

	it('should be able to delete a project', async () => {
		const screen = render(Page, {
			props: {
				data: {
					userData: {
						projects: [
							{ name: 'Europe', regions: [] },
							{ name: 'Asia', regions: [] }
						]
					},
					form: {}
				}
			}
		} as any);

		await screen.getByRole('button').last().click(); // click delete button

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await expect.element(deleteButton).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
	});

	it('should be able to see create project dialog', async () => {
		const form = await superValidate(zod(createProjectSchema));
		const screen = render(Page, {
			props: {
				data: {
					userData: {
						projects: []
					},
					form
				}
			}
		} as any);

		await screen.getByRole('button', { name: /create project/i }).click();

		const dialogSubmit = screen.getByRole('button', { name: 'Create', exact: true });
		await expect.element(dialogSubmit).toBeVisible();

		await userEvent.type(screen.getByLabelText(/project name/i), 'New Project');
		await userEvent.type(screen.getByLabelText(/regions/i), 'Region1{Enter}Region2{Enter}');
	});

	it('should be able to see links to region for each project', async () => {
		const screen = render(Page, {
			props: {
				data: {
					userData: {
						projects: [{ name: 'Europe', regions: [{ name: 'RegionA' }, { name: 'RegionB' }] }]
					},
					form: {}
				}
			}
		} as any);

		await screen.getByRole('button', { name: /toggle europe \(2 regions\)/i }).click();

		await expect.element(screen.getByRole('link', { name: 'RegionA' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'RegionB' })).toBeVisible();
	});
});
