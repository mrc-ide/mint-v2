import type { CasesData, Scenario } from '$lib/types/userState';

export interface CasesAverted {
	year1: number;
	year2: number;
	year3: number;
	average: number;
}
export const getCasesAverted = (cases: CasesData[]): Partial<Record<Scenario, CasesAverted>> => {
	// Group cases by scenario, filtering out year 1 (pre-intervention year)
	const casesPerIntervention = cases.reduce(
		(acc, c) => {
			if (c.year > 1) {
				acc[c.scenario] = acc[c.scenario] || [];
				acc[c.scenario].push(c);
			}
			return acc;
		},
		{} as Record<Scenario, CasesData[]>
	);

	const noInterventionCases = casesPerIntervention['no_intervention'];
	if (!noInterventionCases?.length) return {};

	// Pre-calculate no intervention data
	const noInterventionByYear = new Map(noInterventionCases.map((c) => [c.year, c.casesPer1000]));
	const noInterventionAverage =
		noInterventionCases.reduce((sum, c) => sum + c.casesPer1000, 0) / noInterventionCases.length;

	// Calculate cases averted for each intervention scenario
	const casesAverted: Partial<Record<Scenario, CasesAverted>> = {};

	for (const [scenario, scenarioCases] of Object.entries(casesPerIntervention)) {
		if (scenario === 'no_intervention' || !scenarioCases.length) continue;

		const casesByYear = new Map(scenarioCases.map((c) => [c.year, c.casesPer1000]));
		const scenarioAverage = scenarioCases.reduce((sum, c) => sum + c.casesPer1000, 0) / scenarioCases.length;

		casesAverted[scenario as Scenario] = {
			year1: (noInterventionByYear.get(2) ?? 0) - (casesByYear.get(2) ?? 0),
			year2: (noInterventionByYear.get(3) ?? 0) - (casesByYear.get(3) ?? 0),
			year3: (noInterventionByYear.get(4) ?? 0) - (casesByYear.get(4) ?? 0),
			average: noInterventionAverage - scenarioAverage
		};
	}

	return casesAverted;
};
