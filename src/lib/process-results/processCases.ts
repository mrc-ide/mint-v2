import type { CasesData, Scenario } from '$lib/types/userState';

export interface CasesAverted {
	casesAvertedYear1Per1000: number;
	casesAvertedYear2Per1000: number;
	casesAvertedYear3Per1000: number;
	casesAvertedMeanPer1000: number;
	totalAvertedCases: number;
}
const POST_INTERVENTION_YEARS = [2, 3, 4] as const;

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
	postInterventionCasesMap: Record<Scenario, CasesData[]>,
	population: number
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

		const [casesAvertedYear1Per1000, casesAvertedYear2Per1000, casesAvertedYear3Per1000] = POST_INTERVENTION_YEARS.map(
			(year) => (noInterventionByYear.get(year) ?? 0) - (casesByYear.get(year) ?? 0)
		);

		casesAverted[scenario as Scenario] = {
			casesAvertedYear1Per1000,
			casesAvertedYear2Per1000,
			casesAvertedYear3Per1000,
			casesAvertedMeanPer1000: meanNoInterventionCases - meanCasesForScenario,
			totalAvertedCases:
				(casesAvertedYear1Per1000 + casesAvertedYear2Per1000 + casesAvertedYear3Per1000) * (population / 1000)
		};
	}

	return casesAverted;
};
