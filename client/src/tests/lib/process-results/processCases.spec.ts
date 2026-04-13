import * as processCosts from '$lib/process-results/costs';
import {
	collectPostInterventionCases,
	convertPer1000ToTotal,
	convertTotalToPer1000,
	getAvertedCasesData,
	getMeanCasesPer1000,
	getTotalCasesAndCostsPerScenario,
	getTotalCasesPer1000
} from '$lib/process-results/processCases';
import { PRE_INTERVENTION_YEAR, SCENARIOS, type CasesData, type Scenario } from '$lib/types/userState';

describe('getMeanCasesPostIntervention', () => {
	it('should calculate mean cases correctly', () => {
		const cases: CasesData[] = [
			{ year: 2, scenario: 'irs_only', casesPer1000: 100 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 200 },
			{ year: 4, scenario: 'irs_only', casesPer1000: 300 }
		];

		const result = getMeanCasesPer1000(cases);

		expect(result).toBe(200);
	});

	it('should handle decimal values', () => {
		const cases: CasesData[] = [
			{ year: 2, scenario: 'irs_only', casesPer1000: 100.5 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 200.5 }
		];

		const result = getMeanCasesPer1000(cases);

		expect(result).toBe(150.5);
	});
});

describe('collectPostInterventionCases', () => {
	it('should filter out pre-intervention year and group by scenario', () => {
		const cases: CasesData[] = [
			{ year: PRE_INTERVENTION_YEAR, scenario: 'irs_only', casesPer1000: 100 },
			{ year: 2, scenario: 'irs_only', casesPer1000: 110 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 120 },
			{ year: 2, scenario: 'lsm_only', casesPer1000: 90 },
			{ year: 3, scenario: 'lsm_only', casesPer1000: 95 }
		];

		const result = collectPostInterventionCases(cases);

		expect(result.irs_only).toHaveLength(2);
		expect(result.lsm_only).toHaveLength(2);
		expect(result.irs_only[0].year).toBe(2);
		expect(result.irs_only[1].year).toBe(3);
	});

	it('should include all scenarios even if empty', () => {
		const cases: CasesData[] = [{ year: 2, scenario: 'irs_only', casesPer1000: 100 }];

		const result = collectPostInterventionCases(cases);

		expect(result).toHaveProperty('irs_only');
		expect(result).toHaveProperty('lsm_only');
		expect(result).toHaveProperty('py_only_only');
		expect(result).toHaveProperty('no_intervention');
		expect(result.lsm_only).toEqual([]);
	});

	it('should handle empty input', () => {
		const result = collectPostInterventionCases([]);

		expect(Object.keys(result)).toHaveLength(SCENARIOS.length);
		SCENARIOS.forEach((scenario) => {
			expect(result[scenario]).toEqual([]);
		});
	});

	it('should filter out year 1 specifically', () => {
		const cases: CasesData[] = [
			{ year: 1, scenario: 'irs_only', casesPer1000: 100 },
			{ year: 2, scenario: 'irs_only', casesPer1000: 110 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 120 }
		];

		const result = collectPostInterventionCases(cases);

		expect(result.irs_only).toHaveLength(2);
		expect(result.irs_only.every((c) => c.year > PRE_INTERVENTION_YEAR)).toBe(true);
	});
});

describe('getAvertedCasesData', () => {
	it('should calculate cases averted for intervention scenarios', () => {
		const postInterventionCasesMap: Record<Scenario, CasesData[]> = {
			no_intervention: [
				{ year: 2, scenario: 'no_intervention', casesPer1000: 100 },
				{ year: 3, scenario: 'no_intervention', casesPer1000: 100 },
				{ year: 4, scenario: 'no_intervention', casesPer1000: 100 }
			],
			irs_only: [
				{ year: 2, scenario: 'irs_only', casesPer1000: 80 },
				{ year: 3, scenario: 'irs_only', casesPer1000: 70 },
				{ year: 4, scenario: 'irs_only', casesPer1000: 60 }
			],
			lsm_only: [],
			py_only_only: [],
			py_pbo_only: [],
			py_pyrrole_only: [],
			py_ppf_only: [],
			py_only_with_lsm: [],
			py_pbo_with_lsm: [],
			py_pyrrole_with_lsm: [],
			py_ppf_with_lsm: []
		};

		const result = getAvertedCasesData(postInterventionCasesMap);

		expect(result).not.toHaveProperty('no_intervention');
		expect(result.irs_only?.casesAvertedYear1Per1000).toBe(20);
		expect(result.irs_only?.casesAvertedYear2Per1000).toBe(30);
		expect(result.irs_only?.casesAvertedYear3Per1000).toBe(40);
		expect(result.irs_only?.totalAvertedCasesPer1000).toBe(90);
		expect(result.irs_only?.casesAvertedMeanPer1000).toBeCloseTo(30, 2);
	});

	it('should skip scenarios with empty cases', () => {
		const postInterventionCasesMap: Record<Scenario, CasesData[]> = {
			no_intervention: [
				{ year: 2, scenario: 'no_intervention', casesPer1000: 100 },
				{ year: 3, scenario: 'no_intervention', casesPer1000: 100 },
				{ year: 4, scenario: 'no_intervention', casesPer1000: 100 }
			],
			irs_only: [
				{ year: 2, scenario: 'irs_only', casesPer1000: 80 },
				{ year: 3, scenario: 'irs_only', casesPer1000: 80 },
				{ year: 4, scenario: 'irs_only', casesPer1000: 80 }
			],
			lsm_only: [],
			py_only_only: [],
			py_pbo_only: [],
			py_pyrrole_only: [],
			py_ppf_only: [],
			py_only_with_lsm: [],
			py_pbo_with_lsm: [],
			py_pyrrole_with_lsm: [],
			py_ppf_with_lsm: []
		};

		const result = getAvertedCasesData(postInterventionCasesMap);

		expect(result).toHaveProperty('irs_only');
		expect(result).not.toHaveProperty('lsm_only');
	});

	it('should handle rounded negative mean cases averted by capping at zero', () => {
		const postInterventionCasesMap: Record<Scenario, CasesData[]> = {
			no_intervention: [
				{ year: 2, scenario: 'no_intervention', casesPer1000: 50 },
				{ year: 3, scenario: 'no_intervention', casesPer1000: 50 },
				{ year: 4, scenario: 'no_intervention', casesPer1000: 50 }
			],
			irs_only: [
				{ year: 2, scenario: 'irs_only', casesPer1000: 50.01 },
				{ year: 3, scenario: 'irs_only', casesPer1000: 50.01 },
				{ year: 4, scenario: 'irs_only', casesPer1000: 50.01 }
			],
			lsm_only: [],
			py_only_only: [],
			py_pbo_only: [],
			py_pyrrole_only: [],
			py_ppf_only: [],
			py_only_with_lsm: [],
			py_pbo_with_lsm: [],
			py_pyrrole_with_lsm: [],
			py_ppf_with_lsm: []
		};

		const result = getAvertedCasesData(postInterventionCasesMap);

		expect(result.irs_only?.casesAvertedMeanPer1000).toBe(0);
		expect(result.irs_only?.casesAvertedYear1Per1000).toBe(0);
		expect(result.irs_only?.casesAvertedYear2Per1000).toBe(0);
		expect(result.irs_only?.casesAvertedYear3Per1000).toBe(0);
		expect(result.irs_only?.totalAvertedCasesPer1000).toBe(0);
	});

	it('should calculate total averted cases as sum of yearly averted', () => {
		const postInterventionCasesMap: Record<Scenario, CasesData[]> = {
			no_intervention: [
				{ year: 2, scenario: 'no_intervention', casesPer1000: 100 },
				{ year: 3, scenario: 'no_intervention', casesPer1000: 110 },
				{ year: 4, scenario: 'no_intervention', casesPer1000: 120 }
			],
			irs_only: [
				{ year: 2, scenario: 'irs_only', casesPer1000: 90 },
				{ year: 3, scenario: 'irs_only', casesPer1000: 95 },
				{ year: 4, scenario: 'irs_only', casesPer1000: 100 }
			],
			lsm_only: [],
			py_only_only: [],
			py_pbo_only: [],
			py_pyrrole_only: [],
			py_ppf_only: [],
			py_only_with_lsm: [],
			py_pbo_with_lsm: [],
			py_pyrrole_with_lsm: [],
			py_ppf_with_lsm: []
		};

		const result = getAvertedCasesData(postInterventionCasesMap);

		expect(result.irs_only?.totalAvertedCasesPer1000).toBe(10 + 15 + 20);
	});
});

describe('convertPer1000ToTotal', () => {
	it('should convert per 1000 to total correctly', () => {
		const result = convertPer1000ToTotal(10, 5000);

		expect(result).toBe(50);
	});

	it('should handle zero population', () => {
		const result = convertPer1000ToTotal(10, 0);

		expect(result).toBe(0);
	});

	it('should handle zero per 1000', () => {
		const result = convertPer1000ToTotal(0, 5000);

		expect(result).toBe(0);
	});
});

describe('convertTotalToPer1000', () => {
	it('should convert total to per 1000 correctly', () => {
		const result = convertTotalToPer1000(50, 5000);

		expect(result).toBe(10);
	});

	it('should handle zero population', () => {
		const result = convertTotalToPer1000(50, 0);

		expect(result).toBe(Infinity);
	});

	it('should handle zero total', () => {
		const result = convertTotalToPer1000(0, 5000);

		expect(result).toBe(0);
	});

	it('should be inverse of convertPer1000ToTotal', () => {
		const per1000 = 25;
		const population = 8000;

		const total = convertPer1000ToTotal(per1000, population);
		const backToPer1000 = convertTotalToPer1000(total, population);

		expect(backToPer1000).toBeCloseTo(per1000, 10);
	});
});

describe('getTotalCasesPer1000', () => {
	it('should calculate total cases per 1000 correctly', () => {
		const casesData: CasesData[] = [
			{ year: 2, scenario: 'irs_only', casesPer1000: 10 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 15 },
			{ year: 4, scenario: 'irs_only', casesPer1000: 20 }
		];

		const totalCases = getTotalCasesPer1000(casesData);

		expect(totalCases).toBe(45);
	});
});

describe('getTotalCasesAndCostsPerScenario', () => {
	const formValues = { population: '5000' } as any;
	let getTotalCostsPerScenarioSpy: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		vi.resetAllMocks();
		getTotalCostsPerScenarioSpy = vi.spyOn(processCosts, 'getTotalCostsPerScenario').mockReturnValue({
			irs_only: 1000,
			lsm_only: 500,
			no_intervention: 0
		});
	});
	it('calculates totalCases per scenario from post-intervention years only', async () => {
		const cases: CasesData[] = [
			{ year: PRE_INTERVENTION_YEAR, scenario: 'irs_only', casesPer1000: 999 }, // should be ignored
			{ year: 2, scenario: 'irs_only', casesPer1000: 10 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 20 },
			{ year: 4, scenario: 'irs_only', casesPer1000: 30 },
			{ year: 2, scenario: 'lsm_only', casesPer1000: 5 },
			{ year: 3, scenario: 'lsm_only', casesPer1000: 10 },
			{ year: PRE_INTERVENTION_YEAR, scenario: 'py_only_only', casesPer1000: 50 } // ignored entirely
		];

		const result = getTotalCasesAndCostsPerScenario(cases, formValues);

		expect(result.irs_only?.totalCases).toBe(300); // (10+20+30)/1000 * 5000
		expect(result.lsm_only?.totalCases).toBe(75); // (5+10)/1000 * 5000
		expect(result).not.toHaveProperty('py_only_only');
		expect(getTotalCostsPerScenarioSpy).toHaveBeenCalledWith(['irs_only', 'lsm_only'], formValues);
	});

	it('returns an empty object when there are no post-intervention cases', async () => {
		const cases: CasesData[] = [
			{ year: PRE_INTERVENTION_YEAR, scenario: 'irs_only', casesPer1000: 20 },
			{ year: PRE_INTERVENTION_YEAR, scenario: 'no_intervention', casesPer1000: 30 }
		];

		const result = getTotalCasesAndCostsPerScenario(cases, { population: 1000 } as any);

		expect(result).toEqual({});
	});

	it('converts population from string and wires totalCost from getTotalCostsPerScenario', async () => {
		const cases: CasesData[] = [
			{ year: 2, scenario: 'no_intervention', casesPer1000: 40 },
			{ year: 3, scenario: 'no_intervention', casesPer1000: 50 },
			{ year: 4, scenario: 'no_intervention', casesPer1000: 60 },
			{ year: 2, scenario: 'irs_only', casesPer1000: 10 },
			{ year: 3, scenario: 'irs_only', casesPer1000: 20 },
			{ year: 4, scenario: 'irs_only', casesPer1000: 30 }
		];

		const result = getTotalCasesAndCostsPerScenario(cases, formValues);

		expect(result.irs_only?.totalCost).toBe(1000);
		expect(result.no_intervention?.totalCost).toBe(0);
		expect(getTotalCostsPerScenarioSpy).toHaveBeenCalledWith(['no_intervention', 'irs_only'], formValues);
	});
});
