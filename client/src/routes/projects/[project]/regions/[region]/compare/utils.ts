import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { apiFetch } from '$lib/fetch';
import type { ResponseBodySuccess } from '$lib/types/api';
import type { EmulatorResults } from '$lib/types/userState';
import { regionCompareUrl } from '$lib/url';

export const runCompareEmulator = async (
	project: string,
	region: string,
	longTermFormValues: Record<string, FormValue>,
	presentFormValues: Record<string, FormValue>,
	selectedBaselineParameter: { parameterName: string }
): Promise<{
	fullLongTermResData: EmulatorResults;
	baselineLongTermResData: EmulatorResults;
}> => {
	const fullLongTermPromise = triggerEmulator(project, region, longTermFormValues);
	const baselineLongTermPromise = triggerEmulator(project, region, {
		...presentFormValues,
		[selectedBaselineParameter.parameterName]: longTermFormValues[selectedBaselineParameter.parameterName]
	});
	const [{ data: fullLongTermResData }, { data: baselineLongTermResData }] = await Promise.all([
		fullLongTermPromise,
		baselineLongTermPromise
	]);

	return {
		fullLongTermResData,
		baselineLongTermResData
	};
};

const triggerEmulator = async (
	project: string,
	region: string,
	formValues: Record<string, FormValue>
): Promise<ResponseBodySuccess<EmulatorResults>> =>
	apiFetch<EmulatorResults>({
		url: regionCompareUrl(project, region),
		method: 'POST',
		body: {
			formValues
		}
	});
