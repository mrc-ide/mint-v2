import MetricRow from '$routes/projects/[project]/strategise/_components/MetricRow.svelte';
import { render } from 'vitest-browser-svelte';

describe('Metric Row component', () => {
	it('should render the metric name and value', () => {
		const screen = render(MetricRow, {
			label: 'Cases Averted',
			value: '1234'
		});

		expect(screen.getByText('Cases Averted')).toBeVisible();
		expect(screen.getByText('1234')).toBeVisible();
	});
});
