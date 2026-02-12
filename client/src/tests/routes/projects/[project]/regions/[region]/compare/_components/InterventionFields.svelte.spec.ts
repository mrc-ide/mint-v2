import { MOCK_COMPARE_PARAMETERS, MOCK_FORM_VALUES } from '$mocks/mocks';
import InterventionFields from '$routes/projects/[project]/regions/[region]/compare/_components/InterventionFields.svelte';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';

const renderComponent = (props: Record<string, any> = {}) => {
	const testFormValues = $state(structuredClone(MOCK_FORM_VALUES));
	return render(InterventionFields, {
		isLoading: false,
		presentFormValues: MOCK_FORM_VALUES,
		longTermFormValues: testFormValues,
		interventionParameters: MOCK_COMPARE_PARAMETERS.interventionParameters,
		onSliderChange: vi.fn(),
		...props
	} as any);
};
describe('Compare InterventionFields component', () => {
	it('should render intervention fields', async () => {
		const screen = renderComponent();

		const sliders = screen.getByRole('slider').all();
		expect(sliders).toHaveLength(MOCK_COMPARE_PARAMETERS.interventionParameters.length); // baseline + 3 interventions
		for (const param of MOCK_COMPARE_PARAMETERS.interventionParameters) {
			await expect.element(screen.getByLabelText(param.linkedCosts[0].costLabel)).toBeVisible();
		}
	});

	it('should disable inputs when isLoading is true', async () => {
		const screen = renderComponent({ isLoading: true });

		const sliders = screen.getByRole('slider').all();
		for (const slider of sliders) {
			await expect.element(slider).toBeDisabled();
		}

		for (const param of MOCK_COMPARE_PARAMETERS.interventionParameters) {
			await expect.element(screen.getByLabelText(param.linkedCosts[0].costLabel)).toBeDisabled();
		}
	});

	it('should calculate correct cost delta and display with appropriate sign', async () => {
		const param = MOCK_COMPARE_PARAMETERS.interventionParameters[0];
		const presentCost = MOCK_FORM_VALUES[param.linkedCosts[0].costName as keyof typeof MOCK_FORM_VALUES] as number;

		const screen = renderComponent();

		const input = screen.getByLabelText(param.linkedCosts[0].costLabel);
		await userEvent.fill(input, String(presentCost + 10));

		await expect.element(screen.getByText(`$10`, { exact: false })).toBeVisible();
	});

	it('should be able to collapse cost fields', async () => {
		const screen = renderComponent();
		const testParam = MOCK_COMPARE_PARAMETERS.interventionParameters[0];

		const testCostField = screen.getByLabelText(testParam.linkedCosts[0].costLabel);
		await expect.element(testCostField).toBeVisible();

		await userEvent.click(screen.getByRole('button', { name: testParam.label }));

		await expect.element(testCostField).not.toBeInTheDocument();
	});
});
