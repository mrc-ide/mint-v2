import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { apiFetch } from '$lib/fetch';
import type { ScenarioTotals } from '$lib/process-results/processCases';
import type { ResponseBodySuccess } from '$lib/types/api';
import type { EmulatorResults, Scenario } from '$lib/types/userState';
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
	const fullLongTermPromise = triggerEmulator(project, region, longTermFormValues, true);
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

export const saveFormValues = async (
	project: string,
	region: string,
	formValues: Record<string, FormValue>
): Promise<void> => {
	await apiFetch({
		url: regionCompareUrl(project, region),
		method: 'PATCH',
		body: {
			formValues
		}
	});
};

const triggerEmulator = async (
	project: string,
	region: string,
	formValues: Record<string, FormValue>,
	shouldSave = false
): Promise<ResponseBodySuccess<EmulatorResults>> =>
	apiFetch<EmulatorResults>({
		url: regionCompareUrl(project, region),
		method: 'POST',
		body: {
			formValues,
			shouldSave
		}
	});

export const getScenariosFromTotals = (
	...totalsByTimeFrames: Partial<Record<Scenario, ScenarioTotals>>[]
): Scenario[] => Array.from(new Set(totalsByTimeFrames.flatMap((summary) => Object.keys(summary) as Scenario[])));
