import OverviewMetric from '$routes/projects/[project]/strategise/_components/OverviewMetric.svelte';
import { render } from 'vitest-browser-svelte';

describe('OverviewMetric component', () => {
	it('should render the metric name and value', () => {
		const screen = render(OverviewMetric, {
			title: 'Cases Averted',
			value: '1234'
		});

		expect(screen.getByText('Cases Averted')).toBeVisible();
		expect(screen.getByText('1234')).toBeVisible();
	});
});
