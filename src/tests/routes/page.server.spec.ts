import { actions, load } from '$routes/+page.server';
import type { ActionFailure } from '@sveltejs/kit';

describe('root +page.server.ts', () => {
	describe('load function', () => {
		it('should return English user guide language', async () => {
			const data = await (load({ url: new URL('http://localhost:3000') } as any) as any);

			expect(data.userGuideLanguage).toBe('en');
			expect(data.form).toBeDefined();
		});

		it('should return specified user guide language', async () => {
			const data = await (load({ url: new URL('http://localhost:3000/?lang=fr') } as any) as any);

			expect(data.userGuideLanguage).toBe('fr');
			expect(data.form).toBeDefined();
		});
	});

	describe('actions', () => {
		describe('create action', () => {
			it('successfully creates a new project', async () => {
				const formData = new FormData();
				formData.append('name', 'New Project');
				formData.append('regions', 'Region1');
				formData.append('regions', 'Region2');
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = { userState: { projects: [] } as any };
				const data = await (actions.create({ request, locals } as any) as any);

				expect(locals.userState.projects.length).toBe(1);
				expect(locals.userState.projects[0].name).toBe('New Project');
				expect(locals.userState.projects[0].regions.length).toBe(2);
				expect(data.form.valid).toBe(true);
			});

			it('should fail duplicate project name', async () => {
				const formData = new FormData();
				formData.append('name', 'Existing Project');
				formData.append('regions', 'Region1');
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = {
					userState: { projects: [{ name: 'Existing Project', regions: [] }] } as any
				};
				const res = (await actions.create({ request, locals } as any)) as ActionFailure<any>;

				expect(res.status).toBe(400);
				expect(res.data.form.valid).toBe(false);
				expect(res.data.form.errors.name[0]).toBe('Project names must be unique');
			});
		});

		describe('delete action', () => {
			it('successfully deletes a project', async () => {
				const formData = new FormData();
				formData.append('name', 'Project To Delete');
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = {
					userState: {
						projects: [
							{ name: 'Project To Delete', regions: [] },
							{ name: 'Another Project', regions: [] }
						]
					} as any
				};
				const data = await (actions.delete({ request, locals } as any) as any);

				expect(locals.userState.projects.length).toBe(1);
				expect(locals.userState.projects[0].name).toBe('Another Project');
				expect(data.success).toBe(true);
			});

			it('should fail when project name is missing', async () => {
				const formData = new FormData();
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = { userState: { projects: [] } as any };
				const res = (await actions.delete({ request, locals } as any)) as ActionFailure<any>;

				expect(res.status).toBe(400);
				expect(res.data.error).toBe('Project name is required');
			});
		});
	});
});
