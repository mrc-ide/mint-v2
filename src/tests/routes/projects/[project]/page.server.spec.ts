import { actions } from '$routes/projects/[project]/+page.server';
import type { ActionFailure } from '@sveltejs/kit';

describe('+page.server.ts', () => {
	it('should successfully add region to project', async () => {
		const formData = new FormData();
		formData.append('name', 'New Region');
		const request = new Request(new URL('http://localhost:3000'), {
			method: 'POST',
			body: formData
		});

		const params = { project: 'Test Project' };
		const locals = {
			userState: {
				projects: [
					{
						name: 'Test Project',
						regions: []
					}
				]
			}
		} as any;

		const addRegionPromise = actions.addRegion({ request, params, locals } as any) as any;
		await expect(addRegionPromise).rejects.toThrowError(
			expect.objectContaining({ status: 303, location: expect.stringContaining('New Region') })
		);
		expect(locals.userState.projects[0].regions[0].name).toBe('New Region');
	});

	it("should fail to add region if project doesn't exist", async () => {
		const formData = new FormData();
		formData.append('name', 'New Region');
		const request = new Request(new URL('http://localhost:3000'), {
			method: 'POST',
			body: formData
		});

		const params = { project: 'Nonexistent Project' };
		const locals = {
			userState: {
				projects: []
			}
		} as any;

		const result = (await actions.addRegion({ request, params, locals } as any)) as ActionFailure<any>;
		expect(result.status).toBe(404);
		expect(result.data.addRegionForm.valid).toBe(false);
		expect(result.data.error).toBe('Project "Nonexistent Project" not found');
	});

	it('should fail to add region if region name is duplicate', async () => {
		const formData = new FormData();
		formData.append('name', 'Existing Region');
		const request = new Request(new URL('http://localhost:3000'), {
			method: 'POST',
			body: formData
		});

		const params = { project: 'Test Project' };
		const locals = {
			userState: {
				projects: [
					{
						name: 'Test Project',
						regions: [{ name: 'Existing Region' }]
					}
				]
			}
		} as any;

		const result = (await actions.addRegion({ request, params, locals } as any)) as ActionFailure<any>;
		expect(result.status).toBe(400);
		expect(result.data.addRegionForm.valid).toBe(false);
		expect(result.data.addRegionForm.errors.name[0]).toBe('Region names must be unique');
	});
});
