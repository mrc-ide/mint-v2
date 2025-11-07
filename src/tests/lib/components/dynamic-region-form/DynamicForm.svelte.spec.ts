import { DynamicForm } from '$lib/components/dynamic-region-form';
import { forEachField, forEachGroup, forEachSubGroup } from '$lib/components/dynamic-region-form/utils';
import { MOCK_FORM_SCHEMA } from '$mocks/mocks';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.resetAllMocks();
});

describe('DynamicForm component', () => {
	it('should show submit button when hasRunBaseline = false', async () => {
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: vi.fn(),
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false
			}
		} as any);

		await expect.element(screen.getByRole('button', { name: 'Submit Text' })).toBeVisible();
	});

	it('should set hasRunBaseline to false when run fails', async () => {
		const run = vi.fn().mockRejectedValue(new Error('Run failed'));
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false
			}
		} as any);

		await screen.getByRole('button', { name: 'Submit Text' }).click();

		await expect.element(screen.getByRole('button', { name: 'Submit Text' })).toBeVisible();
	});

	it('should not show submit button & children when hasRunBaseline = true', async () => {
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: true,
				run: vi.fn(),
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await expect.element(screen.getByRole('button', { name: 'Submit Text' })).not.toBeInTheDocument();
		await expect.element(screen.getByText('Child Content')).toBeVisible();
	});

	it('should disable inputs when isInputsDisabled = true', async () => {
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: vi.fn(),
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: true
			}
		} as any);

		forEachField(MOCK_FORM_SCHEMA.groups as any, async (field) => {
			const input = screen.getByLabelText(field.label, { exact: true });
			await expect.element(input).toBeDisabled();
		});
	});

	it('should call run when the submit button is clicked', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: true,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByRole('button', { name: 'Submit Text' }).click();

		expect(run).toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Submit Text' })).not.toBeInTheDocument();
	});

	it('should call run when form field changes that triggers run and hasRunBaseline = true', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: true,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByRole('button', { name: 'Baseline Options', exact: true }).click();
		await screen.getByLabelText('Size of population', { exact: true }).fill('5000');

		vi.runAllTimers();

		expect(run).toHaveBeenCalled();
	});

	it('should not call run when form field changes that triggers run and hasRunBaseline = false', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByRole('button', { name: 'Baseline Options', exact: true }).click();
		await screen.getByLabelText('Size of population', { exact: true }).fill('5000');

		expect(run).not.toHaveBeenCalled();
	});

	it("should call process when form field changes that doesn't trigger run and hasRunBaseline = true", async () => {
		const process = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: true,
				run: vi.fn(),
				process: process,
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByLabelText('Number of People per bed net', { exact: true }).fill('5');

		vi.runAllTimers();

		expect(process).toHaveBeenCalled();
	});

	it('should disable submit button when form field has errors', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: false,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByLabelText('Size of population').fill('-5000');

		await expect.element(screen.getByRole('button', { name: 'Submit Text' })).toBeDisabled();
	});

	it('should not run when field changes and has errors', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: true,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		await screen.getByRole('button', { name: 'Baseline Options', exact: true }).click();
		await screen.getByLabelText('Size of population').fill('-5000');

		expect(run).not.toHaveBeenCalled();
	});

	it('should be able to collapse and expand groups', async () => {
		const run = vi.fn(() => Promise.resolve());
		const screen = render(DynamicForm, {
			props: {
				schema: MOCK_FORM_SCHEMA,
				initialValues: {},
				hasRunBaseline: true,
				run: run,
				process: vi.fn(),
				submitText: 'Submit Text',
				isInputsDisabled: false,
				children: createRawSnippet(() => ({
					render: () => `<div>Child Content</div>`
				}))
			}
		} as any);

		forEachSubGroup(MOCK_FORM_SCHEMA.groups as any, async (group, subGroup) => {
			if (subGroup.collapsible) {
				const field = screen.getByLabelText(subGroup.fields[0].label, { exact: true });
				await expect.element(field).toBeVisible();
				await screen.getByRole('button', { name: subGroup.title, exact: true }).click();
				await expect.element(field).not.toBeVisible();
			}
		});

		forEachGroup(MOCK_FORM_SCHEMA.groups as any, async (group) => {
			if (group.collapsible) {
				const sg = screen.getByRole('button', { name: group.subGroups[0].title, exact: true });
				await expect.element(sg).toBeVisible();
				await screen.getByRole('button', { name: group.title, exact: true }).click();
				await expect.element(sg).not.toBeVisible();
			}
		});
	});
});
