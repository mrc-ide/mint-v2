import FieldWithChange from '$lib/components/FieldWithChange.svelte';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';

describe('FieldWithChange component', () => {
	it('should render child with with change values', async () => {
		const screen = render(FieldWithChange, {
			value: 10,
			baseline: 5,
			prefixUnit: '$',
			postfixUnit: '%',
			children: createRawSnippet(() => ({
				render: () => '<div>Child Content</div>'
			}))
		} as any);

		await expect.element(screen.getByText('Child Content')).toBeVisible();
		await expect.element(screen.getByText('$5.0%')).toBeVisible();
		await expect.element(screen.getByText('+')).toBeVisible();
	});

	it('should render change as % is displayChangeAsPercentage is true', async () => {
		const screen = render(FieldWithChange, {
			value: 150,
			baseline: 100,
			postfixUnit: '%',
			displayChangeAsPercentage: true,
			children: createRawSnippet(() => ({
				render: () => '<div>Child Content</div>'
			}))
		} as any);

		await expect.element(screen.getByText('50.0%')).toBeVisible();
	});
	it("should render -ve change with '-' sign", async () => {
		const screen = render(FieldWithChange, {
			value: 0,
			baseline: 5,
			prefixUnit: '$',
			postfixUnit: '%',
			children: createRawSnippet(() => ({
				render: () => '<div>Child Content</div>'
			}))
		} as any);

		await expect.element(screen.getByText('-')).toBeVisible();
	});
});
