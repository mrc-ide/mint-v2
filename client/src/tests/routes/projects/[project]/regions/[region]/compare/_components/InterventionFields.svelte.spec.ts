import { MOCK_COMPARE_PARAMETERS, MOCK_FORM_VALUES } from '$mocks/mocks';
import InterventionFields from '$routes/projects/[project]/regions/[region]/compare/_components/InterventionFields.svelte';
import { render } from 'vitest-browser-svelte';

const renderComponent = (props: Record<string, any> = {}) => {
	const mockFormValues = structuredClone(MOCK_FORM_VALUES);

	return render(InterventionFields, {
		props: {
			isLoading: false,
			presentFormValues: mockFormValues,
			longTermFormValues: mockFormValues,
			interventionParameters: MOCK_COMPARE_PARAMETERS.interventionParameters,
			onSliderChange: vi.fn(),
			...props
		}
	} as any);
};
describe('Compare InterventionFields component', () => {
	it('should render intervention fields', async () => {
		const screen = renderComponent();

		const sliders = screen.getByRole('slider').all();
		expect(sliders).toHaveLength(MOCK_COMPARE_PARAMETERS.interventionParameters.length); // baseline + 3 interventions
		for (const param of MOCK_COMPARE_PARAMETERS.interventionParameters) {
			await expect.element(screen.getByLabelText(param.linkedCostLabel)).toBeVisible();
		}
	});

	it('should disable inputs when isLoading is true', async () => {
		const screen = renderComponent({ isLoading: true });

		const sliders = screen.getByRole('slider').all();
		for (const slider of sliders) {
			await expect.element(slider).toBeDisabled();
		}

		for (const param of MOCK_COMPARE_PARAMETERS.interventionParameters) {
			await expect.element(screen.getByLabelText(param.linkedCostLabel)).toBeDisabled();
		}
	});

	it('should calculate correct cost delta and display with appropriate sign', async () => {
		const param = MOCK_COMPARE_PARAMETERS.interventionParameters[0];
		const presentCost = MOCK_FORM_VALUES[param.linkedCostName as keyof typeof MOCK_FORM_VALUES] as number;

		const screen = renderComponent();

		await screen.getByLabelText(param.linkedCostLabel).fill(`${presentCost + 10}`);

		await expect.element(screen.getByText(`$10.0`)).toBeVisible();
	});
});
