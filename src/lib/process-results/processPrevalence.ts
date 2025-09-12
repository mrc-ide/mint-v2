import type { PrevalenceData, Scenario } from '$lib/types/userState';

export const getPostInterventionPrevalence = (prevalenceData: PrevalenceData[], scenario: Scenario) => {
	return prevalenceData.filter((p) => p.scenario === scenario && p.days > 365);
};

export const getMeanPrevalencePostIntervention = (prevalenceData: PrevalenceData[], scenario: Scenario) => {
	const prevalencePostIntervention = getPostInterventionPrevalence(prevalenceData, scenario);
	const meanPrevalence =
		prevalencePostIntervention.reduce((sum, p) => sum + p.prevalence, 0) / prevalencePostIntervention.length;
	return meanPrevalence;
};
