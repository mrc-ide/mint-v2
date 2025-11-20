import type { EmulatorResults, PrevalenceData, Scenario } from '$lib/types/userState';

export const getPostInterventionPrevalence = (prevalenceData: PrevalenceData[], scenario: Scenario) => {
	return prevalenceData.filter((p) => p.scenario === scenario && p.days > 365);
};

export const getMeanPrevalencePostIntervention = (prevalenceData: PrevalenceData[], scenario: Scenario) => {
	const prevalencePostIntervention = getPostInterventionPrevalence(prevalenceData, scenario);
	const meanPrevalence =
		prevalencePostIntervention.reduce((sum, p) => sum + p.prevalence, 0) / prevalencePostIntervention.length;
	return meanPrevalence;
};

export const validateBaselinePrevalence = (prevalenceData: PrevalenceData[], currentMalariaPrevalence: number) => {
	const preInterventionPrevalence = prevalenceData.filter((p) => p.scenario === 'no_intervention' && p.days / 365 <= 1);
	if (preInterventionPrevalence.length === 0) return false;

	const meanYear1Prevalence =
		preInterventionPrevalence.reduce((sum, p) => sum + p.prevalence, 0) / preInterventionPrevalence.length;

	return Math.abs(meanYear1Prevalence - currentMalariaPrevalence) < 0.05;
};

export const MODEL_INTERPRETATION_WARNINGS = {
	EIR_HIGH:
		'The combination of previous interventions means estimates of the entomological inoculation rate (EIR) are > 350 infectious bites/year prior to control interventions. This is extremely high — exercise caution when interpreting these findings.',
	BASELINE_MISMATCH:
		'Model starting prevalence differs from the input prevalence by > 5%. Exercise caution when interpreting these findings.'
} as const;

export const getModelInvalidMessage = (
	emulatorResults: EmulatorResults,
	currentMalariaPrevalence: number
): string | undefined => {
	if (!emulatorResults.eirValid) return MODEL_INTERPRETATION_WARNINGS.EIR_HIGH;
	if (!validateBaselinePrevalence(emulatorResults.prevalence, currentMalariaPrevalence)) {
		return MODEL_INTERPRETATION_WARNINGS.BASELINE_MISMATCH;
	}

	return undefined;
};
