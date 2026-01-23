import { testWithWorker } from './../../../../../../../test-extend';
import { forEachField } from '$lib/components/dynamic-region-form/utils';
import { MOCK_CASES_DATA, MOCK_FORM_SCHEMA, MOCK_FORM_VALUES, MOCK_PREVALENCE_DATA } from '$mocks/mocks';
import Page from '$routes/projects/[project]/regions/[region]/+page.svelte';
import { render } from 'vitest-browser-svelte';
import { HttpResponse, http } from 'msw';
import { invalidateAll } from '$app/navigation';

const mockUrl = vi.hoisted(() => '/mocked/region/url');
vi.mock('$lib/url', () => ({
	regionUrl: vi.fn().mockReturnValue(mockUrl)
}));
vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn()
}));

describe('page.svelte', () => {
	it('should render dynamic form with run button when not run yet', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						formValues: {},
						hasRunBaseline: false
					},
					formSchema: MOCK_FORM_SCHEMA
				},
				params: {
					project: 'test-project',
					region: 'test-region'
				}
			}
		} as any);

		await expect.element(screen.getByRole('button', { name: 'Run baseline' })).toBeVisible();

		forEachField(MOCK_FORM_SCHEMA.groups as any, async (field) => {
			await expect.element(screen.getByLabelText(field.label)).toBeVisible();
		});
	});

	testWithWorker('should run emulator and call invalidateAll', async ({ worker }) => {
		worker.use(
			http.post(mockUrl, async () => {
				return HttpResponse.json({
					status: 'success',
					errors: null,
					data: {
						cases: MOCK_CASES_DATA,
						prevalence: MOCK_PREVALENCE_DATA
					}
				});
			})
		);

		const screen = render(Page, {
			props: {
				data: {
					region: {
						formValues: MOCK_FORM_VALUES,
						hasRunBaseline: false
					},
					formSchema: MOCK_FORM_SCHEMA
				},
				params: {
					project: 'test-project',
					region: 'test-region'
				}
			}
		} as any);

		await screen.getByRole('button', { name: 'Run baseline' }).click();

		await expect.element(screen.getByText('Running...')).toBeVisible();
		await vi.waitFor(() => expect(vi.mocked(invalidateAll)).toHaveBeenCalled());
	});

	it('should display results on load if available', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						formValues: MOCK_FORM_VALUES,
						hasRunBaseline: true,
						results: {
							cases: MOCK_CASES_DATA,
							prevalence: MOCK_PREVALENCE_DATA
						}
					},
					formSchema: MOCK_FORM_SCHEMA
				},
				params: {
					project: 'test-project',
					region: 'test-region'
				}
			}
		} as any);

		await expect.element(screen.getByRole('heading', { name: 'Projected prevalence in under' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Clinical cases averted per' })).toBeVisible();
	});

	testWithWorker("should call patch when changing value that doesn't require a rerun", async ({ worker }) => {
		worker.use(
			http.patch(mockUrl, async ({ request }) => {
				const body = await request.clone().json();
				expect(body).toMatchObject({ formValues: { people_per_bednet: 3 } });

				return HttpResponse.json({
					status: 'success',
					errors: null,
					data: {}
				});
			})
		);
		const screen = render(Page, {
			props: {
				data: {
					region: {
						formValues: MOCK_FORM_VALUES,
						hasRunBaseline: true,
						results: {
							cases: MOCK_CASES_DATA,
							prevalence: MOCK_PREVALENCE_DATA
						}
					},
					formSchema: MOCK_FORM_SCHEMA
				},
				params: {
					project: 'test-project',
					region: 'test-region'
				}
			}
		} as any);

		await screen.getByLabelText('Number of People per bed net').fill('3');

		await expect.element(screen.getByLabelText('Number of People per bed net')).toHaveValue(3);
	});

	it('should be able to switch tabs when results are shown', async () => {
		const screen = render(Page, {
			props: {
				data: {
					region: {
						formValues: MOCK_FORM_VALUES,
						hasRunBaseline: true,
						results: {
							cases: MOCK_CASES_DATA,
							prevalence: MOCK_PREVALENCE_DATA
						}
					},
					formSchema: MOCK_FORM_SCHEMA
				},
				params: {
					project: 'test-project',
					region: 'test-region'
				}
			}
		} as any);

		await screen.getByRole('tab', { name: 'Cost' }).click();

		await expect.element(screen.getByRole('heading', { name: 'Strategy costs over 3 years vs' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Strategy costs per case' })).toBeVisible();
	});
});
