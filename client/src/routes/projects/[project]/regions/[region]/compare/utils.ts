import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { apiFetch } from '$lib/fetch';
import type { ScenarioTotals } from '$lib/process-results/processCases';
import type { EmulatorResults, Scenario } from '$lib/types/userState';
import { regionCompareUrl } from '$lib/url';

export const runCompareEmulator = async (
	project: string,
	region: string,
	longTermFormValues: Record<string, FormValue>,
	presentFormValues: Record<string, FormValue>,
	selectedBaselineParameter: { parameterName: string }
): Promise<{
	fullLongTerm: EmulatorResults;
	baselineLongTerm: EmulatorResults;
}> => {
	const {
		data: { baselineLongTerm, fullLongTerm }
	} = await apiFetch<{ baselineLongTerm: EmulatorResults; fullLongTerm: EmulatorResults }>({
		url: regionCompareUrl(project, region),
		method: 'POST',
		body: {
			fullLongTermFormValues: longTermFormValues,
			baselineLongTermFormValues: {
				...presentFormValues,
				[selectedBaselineParameter.parameterName]: longTermFormValues[selectedBaselineParameter.parameterName]
			}
		}
	});

	return {
		fullLongTerm,
		baselineLongTerm
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

export const getScenariosFromTotals = (
	...totalsByTimeFrames: Partial<Record<Scenario, ScenarioTotals>>[]
): Scenario[] => Array.from(new Set(totalsByTimeFrames.flatMap((summary) => Object.keys(summary) as Scenario[])));
