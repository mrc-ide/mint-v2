import { ScenarioToLabel } from '$lib/charts/baseChart';
import CompareStrategyCard from '$routes/projects/[project]/strategise/_components/CompareStrategyCard.svelte';
import { render } from 'vitest-browser-svelte';

const mockSummary = {
	totalCost: 1000,
	totalCases: 50,
	costPerCase: 90,
	interventions: [
		{
			intervention: 'py_pbo_only',
			cost: 400,
			cases: 30,
			region: 'hello'
		},
		{
			intervention: 'py_only_only',
			cost: 600,
			cases: 20,
			region: 'world'
		}
	]
};
describe('CompareStrategyCard component', () => {
	it('should render totals + intervention details', () => {
		const screen = render(CompareStrategyCard, {
			title: 'Test Strategy',
			summary: mockSummary as any
		});

		expect(screen.getByRole('heading', { name: 'Test Strategy' })).toBeVisible();
		expect(screen.getByText('$1,000')).toBeVisible();
		expect(screen.getByText('50')).toBeVisible();
		expect(screen.getByText('$90')).toBeVisible();

		// interventions
		expect(screen.getByRole('heading', { name: 'hello' })).toBeVisible();
		expect(screen.getByText(ScenarioToLabel['py_pbo_only'])).toBeVisible();
		expect(screen.getByText('$400')).toBeVisible();
		expect(screen.getByText('$30')).toBeVisible();

		expect(screen.getByRole('heading', { name: 'world' })).toBeVisible();
		expect(screen.getByText(ScenarioToLabel['py_only_only'])).toBeVisible();
		expect(screen.getByText('$600')).toBeVisible();
		expect(screen.getByText('20')).toBeVisible();
	});
});
