import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { apiFetch } from '$lib/fetch';
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
	const fullLongTermPromise = apiFetch<EmulatorResults>({
		url: regionCompareUrl(project, region),
		method: 'POST',
		body: {
			formValues: longTermFormValues
		}
	});
	const baselineLongTermPromise = apiFetch<EmulatorResults>({
		url: regionCompareUrl(project, region),
		method: 'POST',
		body: {
			formValues: {
				...presentFormValues,
				[selectedBaselineParameter.parameterName]: longTermFormValues[selectedBaselineParameter.parameterName]
			}
		}
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
