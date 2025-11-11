import {
	getPostInterventionPrevalence,
	getMeanPrevalencePostIntervention,
	validateBaselinePrevalence
} from '$lib/process-results/processPrevalence';
import type { PrevalenceData, Scenario } from '$lib/types/userState';

describe('getPostInterventionPrevalence', () => {
	it('should filter prevalence data for specific scenario after day 365', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 100, prevalence: 0.1 },
			{ scenario: 'irs_only', days: 365, prevalence: 0.12 },
			{ scenario: 'irs_only', days: 400, prevalence: 0.08 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.06 },
			{ scenario: 'lsm_only', days: 500, prevalence: 0.09 }
		];

		const result = getPostInterventionPrevalence(prevalenceData, 'irs_only');

		expect(result).toHaveLength(2);
		expect(result[0].scenario).toBe('irs_only');
		expect(result[0].days).toBe(400);
		expect(result[1].days).toBe(730);
	});

	it('should return empty array when no data matches scenario', () => {
		const prevalenceData: PrevalenceData[] = [{ scenario: 'irs_only', days: 400, prevalence: 0.08 }];

		const result = getPostInterventionPrevalence(prevalenceData, 'lsm_only');

		expect(result).toEqual([]);
	});

	it('should handle empty input array', () => {
		const result = getPostInterventionPrevalence([], 'irs_only');

		expect(result).toEqual([]);
	});

	it('should exclude day 365 exactly', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 365, prevalence: 0.12 },
			{ scenario: 'irs_only', days: 366, prevalence: 0.11 }
		];

		const result = getPostInterventionPrevalence(prevalenceData, 'irs_only');

		expect(result).toHaveLength(1);
		expect(result[0].days).toBe(366);
	});
});

describe('getMeanPrevalencePostIntervention', () => {
	it('should calculate mean prevalence for post-intervention period', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 100, prevalence: 0.2 },
			{ scenario: 'irs_only', days: 400, prevalence: 0.08 },
			{ scenario: 'irs_only', days: 730, prevalence: 0.06 },
			{ scenario: 'irs_only', days: 1095, prevalence: 0.04 }
		];

		const result = getMeanPrevalencePostIntervention(prevalenceData, 'irs_only');

		expect(result).toBeCloseTo(0.06, 2);
	});

	it('should return NaN when no post-intervention data exists', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'irs_only', days: 100, prevalence: 0.2 },
			{ scenario: 'irs_only', days: 365, prevalence: 0.15 }
		];

		const result = getMeanPrevalencePostIntervention(prevalenceData, 'irs_only');

		expect(result).toBeNaN();
	});

	it('should calculate mean for all intervention scenarios', () => {
		const scenarios: Scenario[] = ['irs_only', 'lsm_only', 'py_only_only'];
		const prevalenceData: PrevalenceData[] = scenarios.flatMap((scenario) => [
			{ scenario, days: 400, prevalence: 0.08 },
			{ scenario, days: 730, prevalence: 0.06 }
		]);

		scenarios.forEach((scenario) => {
			const result = getMeanPrevalencePostIntervention(prevalenceData, scenario);
			expect(result).toBeCloseTo(0.07, 2);
		});
	});
});

describe('validateBaselinePrevalence', () => {
	it('should return true when baseline prevalence matches within tolerance', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.15 },
			{ scenario: 'no_intervention', days: 200, prevalence: 0.14 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.16 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});

	it('should return false when baseline prevalence differs by more than 0.05', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.1 },
			{ scenario: 'no_intervention', days: 200, prevalence: 0.12 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.11 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.2);

		expect(result).toBe(false);
	});

	it('should return false when no pre-intervention data exists', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 400, prevalence: 0.15 },
			{ scenario: 'no_intervention', days: 730, prevalence: 0.14 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(false);
	});

	it('should only consider no_intervention scenario', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.15 },
			{ scenario: 'irs_only', days: 100, prevalence: 0.25 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.15 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});

	it('should include day 365 in baseline calculation', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.1 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.2 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});

	it('should exclude data after day 365', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.15 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.15 },
			{ scenario: 'no_intervention', days: 366, prevalence: 0.5 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});

	it('should handle exact boundary cases for tolerance', () => {
		const prevalenceData: PrevalenceData[] = [{ scenario: 'no_intervention', days: 100, prevalence: 0.2 }];

		// Exactly at tolerance boundary (0.20 - 0.15 = 0.05)
		expect(validateBaselinePrevalence(prevalenceData, 0.15)).toBe(false);

		// Just within tolerance (0.1999 - 0.15 = 0.0499)
		const prevalenceDataWithin: PrevalenceData[] = [{ scenario: 'no_intervention', days: 100, prevalence: 0.1999 }];
		expect(validateBaselinePrevalence(prevalenceDataWithin, 0.15)).toBe(true);
	});

	it('should validate with negative difference within tolerance', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 100, prevalence: 0.12 },
			{ scenario: 'no_intervention', days: 200, prevalence: 0.11 }
		];

		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});

	it('should calculate mean across multiple pre-intervention time points', () => {
		const prevalenceData: PrevalenceData[] = [
			{ scenario: 'no_intervention', days: 50, prevalence: 0.1 },
			{ scenario: 'no_intervention', days: 150, prevalence: 0.15 },
			{ scenario: 'no_intervention', days: 250, prevalence: 0.2 },
			{ scenario: 'no_intervention', days: 365, prevalence: 0.15 }
		];

		// Mean = (0.10 + 0.15 + 0.20 + 0.15) / 4 = 0.15
		const result = validateBaselinePrevalence(prevalenceData, 0.15);

		expect(result).toBe(true);
	});
});
