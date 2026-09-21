import * as urlModule from '$lib/url';
import { MOCK_FORM_SCHEMA } from '$mocks/mocks';
import { server } from '$mocks/server';
import { actions, load } from '$routes/+page.server';
import { isHttpError, type ActionFailure, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';

describe('root +page.server.ts', () => {
	describe('load function', () => {
		it('should return English user guide language', async () => {
			const data = await (load({ url: new URL('http://localhost:3000') } as any) as any);

			expect(data.userGuideLanguage).toBe('en');
			expect(data.form).toBeDefined();
			expect(data.uploadForm).toBeDefined();
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

		describe('upload action', () => {
			const optionsUrl = 'http://localhost:8080/options';
			const uploadRequest = (name: string, csv: string | Uint8Array<ArrayBuffer>) => {
				const formData = new FormData();
				formData.append('name', name);
				formData.append('file', new File([csv], 'regions.csv', { type: 'text/csv' }));
				return new Request(new URL('http://localhost:3000'), { method: 'POST', body: formData });
			};

			beforeEach(() => {
				vi.spyOn(urlModule, 'regionFormUrl').mockReturnValue(optionsUrl);
				server.use(http.get(optionsUrl, () => HttpResponse.json({ data: MOCK_FORM_SCHEMA })));
			});

			it('creates a project with a region per CSV row', async () => {
				const request = uploadRequest('CSV Project', 'Region,population\nNorth,50000\nSouth,60000\n');
				const locals = { userState: { projects: [] } as any };

				const data = await (actions.upload({ request, locals, fetch: fetch.bind(globalThis) } as any) as any);

				expect(locals.userState.projects).toHaveLength(1);
				expect(locals.userState.projects[0].name).toBe('CSV Project');
				expect(locals.userState.projects[0].regions.map((region: any) => region.name)).toEqual(['North', 'South']);
				expect(locals.userState.projects[0].regions[0].hasRunBaseline).toBe(false);
				// values not set in the CSV fall back to the defaults of the form schema
				expect(locals.userState.projects[0].regions[0].formValues).toMatchObject({
					population: 50000,
					procurement_buffer: 7
				});
				// the regions are handed back so that the client can run the emulator for each of them
				expect(data.form.message).toEqual({ name: 'CSV Project', regions: locals.userState.projects[0].regions });
			});

			it('reads a CSV saved in the Windows code page, keeping accented region names', async () => {
				// "Region\nRégion Nord\n" as Excel saves it with the plain "CSV" option
				const bytes = Uint8Array.from(
					[...'Region\nR?gion Nord\n'].map((char) => (char === '?' ? 0xe9 : char.charCodeAt(0)))
				);
				const request = uploadRequest('CSV Project', bytes);
				const locals = { userState: { projects: [] } as any };

				await actions.upload({ request, locals, fetch: fetch.bind(globalThis) } as any);

				expect(locals.userState.projects[0].regions[0].name).toBe('Région Nord');
			});

			it('should fail when the project name is missing', async () => {
				const request = uploadRequest('', 'Region\nNorth\n');
				const locals = { userState: { projects: [] } as any };

				const res = (await actions.upload({
					request,
					locals,
					fetch: fetch.bind(globalThis)
				} as any)) as ActionFailure<any>;

				expect(res.status).toBe(400);
				expect(res.data.form.errors.name[0]).toBe('Project name is required');
				expect(locals.userState.projects).toHaveLength(0);
			});

			it('should fail duplicate project name', async () => {
				const request = uploadRequest('Existing Project', 'Region\nNorth\n');
				const locals = { userState: { projects: [{ name: 'Existing Project', regions: [] }] } as any };

				const res = (await actions.upload({
					request,
					locals,
					fetch: fetch.bind(globalThis)
				} as any)) as ActionFailure<any>;

				expect(res.status).toBe(400);
				expect(res.data.form.errors.name[0]).toBe('Project names must be unique');
				expect(locals.userState.projects).toHaveLength(1);
			});

			it('should fail with the problems found in the CSV', async () => {
				const request = uploadRequest('CSV Project', 'Region,population\nNorth,lots\n');
				const locals = { userState: { projects: [] } as any };

				const res = (await actions.upload({
					request,
					locals,
					fetch: fetch.bind(globalThis)
				} as any)) as ActionFailure<any>;

				expect(res.status).toBe(400);
				expect(res.data.form.errors.file).toEqual(['Row 2: "Size of population" must be a number, but is "lots".']);
				expect(locals.userState.projects).toHaveLength(0);
			});

			it('should throw when the form schema cannot be fetched', async () => {
				server.use(http.get(optionsUrl, () => HttpResponse.json({ detail: 'nope' }, { status: 503 })));
				const request = uploadRequest('CSV Project', 'Region\nNorth\n');
				const locals = { userState: { projects: [] } as any };

				try {
					await (actions.upload({ request, locals, fetch: fetch.bind(globalThis) } as any) as any);
					expect.unreachable('upload should have thrown');
				} catch (e) {
					expect(isHttpError(e)).toBe(true);
					expect((e as HttpError).status).toBe(503);
				}
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

		describe('setCompareEnabled action', () => {
			it('should enable compare mode when switch is on', async () => {
				const formData = new FormData();
				formData.append('compare-enabled-switch', 'on');
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = { userState: { compareEnabled: false } as any };
				const data = await (actions.setCompareEnabled({ request, locals } as any) as any);

				expect(locals.userState.compareEnabled).toBe(true);
				expect(data.success).toBe(true);
			});

			it('should disable compare mode when switch is off', async () => {
				const formData = new FormData();
				formData.append('compare-enabled-switch', 'off');
				const request = new Request(new URL('http://localhost:3000'), {
					method: 'POST',
					body: formData
				});

				const locals = { userState: { compareEnabled: true } as any };
				const data = await (actions.setCompareEnabled({ request, locals } as any) as any);

				expect(locals.userState.compareEnabled).toBe(false);
				expect(data.success).toBe(true);
			});
		});
	});
});
