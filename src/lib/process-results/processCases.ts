import type { CasesData, Scenario } from '$lib/types/userState';

export interface CasesAverted {
	casesAvertedYear1Per1000: number;
	casesAvertedYear2Per1000: number;
	casesAvertedYear3Per1000: number;
	casesAvertedMeanPer1000: number;
}

export const getMeanCasesPostIntervention = (postInterventionCases: CasesData[]) =>
	postInterventionCases.reduce((sum, c) => sum + c.casesPer1000, 0) / postInterventionCases.length;

// Group cases by scenario, filtering out year 1 (pre-intervention year)
export const collectPostInterventionCases = (cases: CasesData[]) => {
	return cases.reduce(
		(acc, c) => {
			if (c.year > 1) {
				acc[c.scenario] = acc[c.scenario] || [];
				acc[c.scenario].push(c);
			}
			return acc;
		},
		{} as Record<Scenario, CasesData[]>
	);
};

export const getAvertedCasesData = (
	postInterventionCasesMap: Record<Scenario, CasesData[]>
): Partial<Record<Scenario, CasesAverted>> => {
	const noInterventionCases = postInterventionCasesMap['no_intervention'];
	if (!noInterventionCases?.length) return {};

	// Pre-calculate no intervention data
	const noInterventionByYear = new Map(noInterventionCases.map((c) => [c.year, c.casesPer1000]));
	const meanNoInterventionCases = getMeanCasesPostIntervention(noInterventionCases);

	// Calculate cases averted for each intervention scenario
	const casesAverted: Partial<Record<Scenario, CasesAverted>> = {};

	for (const [scenario, scenarioCases] of Object.entries(postInterventionCasesMap)) {
		if (scenario === 'no_intervention' || !scenarioCases.length) continue;

		const casesByYear = new Map(scenarioCases.map((c) => [c.year, c.casesPer1000]));
		const meanCasesForScenario = getMeanCasesPostIntervention(scenarioCases);

		casesAverted[scenario as Scenario] = {
			casesAvertedYear1Per1000: (noInterventionByYear.get(2) ?? 0) - (casesByYear.get(2) ?? 0),
			casesAvertedYear2Per1000: (noInterventionByYear.get(3) ?? 0) - (casesByYear.get(3) ?? 0),
			casesAvertedYear3Per1000: (noInterventionByYear.get(4) ?? 0) - (casesByYear.get(4) ?? 0),
			casesAvertedMeanPer1000: meanNoInterventionCases - meanCasesForScenario
		};
	}

	return casesAverted;
};
