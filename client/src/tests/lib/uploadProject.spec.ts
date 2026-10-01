import type { Project } from '$lib/types/userState';
import { runUploadedProjectRegions } from '$lib/uploadProject';
import * as urlModule from '$lib/url';
import { server } from '$mocks/server';
import { http, HttpResponse } from 'msw';

describe('runUploadedProjectRegions', () => {
	const uploadedProject = {
		name: 'CSV-Project',
		regions: [
			{ name: 'North', hasRunBaseline: false, formValues: { population: 100 } },
			{ name: 'South', hasRunBaseline: false, formValues: { population: 200 } }
		]
	} satisfies Project;

	beforeEach(() => {
		// the regions are run from the browser, where the relative URL resolves against the page origin
		vi.spyOn(urlModule, 'regionUrl').mockImplementation(
			(projectName, regionName) => `http://localhost:3000/projects/${projectName}/regions/${regionName}`
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should run every region in turn and report progress', async () => {
		const runOrder: string[] = [];
		server.use(
			http.post('http://localhost:3000/projects/CSV-Project/regions/:region', ({ params }) => {
				runOrder.push(params.region as string);
				return HttpResponse.json({ data: {} });
			})
		);
		const progress: number[] = [];

		const failedRegions = await runUploadedProjectRegions(uploadedProject, (count) => progress.push(count));

		expect(failedRegions).toEqual([]);
		expect(runOrder).toEqual(['North', 'South']);
		expect(progress).toEqual([1, 2]);
	});

	it('should send the form values of each region', async () => {
		const bodies: unknown[] = [];
		server.use(
			http.post('http://localhost:3000/projects/CSV-Project/regions/:region', async ({ request }) => {
				bodies.push(await request.json());
				return HttpResponse.json({ data: {} });
			})
		);

		await runUploadedProjectRegions(uploadedProject, () => {});

		expect(bodies).toEqual([{ formValues: { population: 100 } }, { formValues: { population: 200 } }]);
	});

	it('should carry on after a failed region and report the ones that failed', async () => {
		server.use(
			http.post('http://localhost:3000/projects/CSV-Project/regions/North', () =>
				HttpResponse.json({ detail: 'nope' }, { status: 500 })
			),
			http.post('http://localhost:3000/projects/CSV-Project/regions/South', () => HttpResponse.json({ data: {} }))
		);
		const progress: number[] = [];

		const failedRegions = await runUploadedProjectRegions(uploadedProject, (count) => progress.push(count));

		expect(failedRegions).toEqual(['North']);
		expect(progress).toEqual([1, 2]);
	});
});
