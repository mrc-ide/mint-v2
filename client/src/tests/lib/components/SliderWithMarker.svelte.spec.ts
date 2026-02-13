import SliderWithMarker from '$lib/components/SliderWithMarker.svelte';
import { render } from 'vitest-browser-svelte';

describe('SliderWithMarker component', () => {
	it('should render slider with marker and change value', async () => {
		const value = $state(10);
		const screen = render(SliderWithMarker, {
			type: 'single',
			onValueChange: vi.fn(),
			value: () => value,
			markerValue: 5,
			unit: '%',
			min: 0,
			max: 100,
			className: 'test-slider',
			containerClass: 'containerClass'
		} as any);

		await expect.element(screen.getByRole('slider')).toBeInTheDocument();
		await expect.element(screen.getByText('5%')).toBeVisible();
		await expect.element(screen.getByText('-')).toBeVisible();
	});
});
