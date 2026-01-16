import type { FormValue } from '$lib/components/dynamic-region-form/types';
import {
	calculateContinuousItnCosts,
	calculateItnDistributionCosts,
	combineCostsAndCasesAverted,
	getFormCostOptions,
	getIrsTotalCost,
	getItnTotalCost,
	getLsmTotalCost,
	getScenarioCostCalculators,
	getTotalCostsPerScenario,
	type CostOptions
} from '$lib/process-results/costs';
import type { CasesAverted } from '$lib/process-results/processCases';
import { POST_INTERVENTION_YEARS, type Scenario } from '$lib/types/userState';

describe('calculateContinuousItnCosts', () => {
	it('should calculate continuous ITN costs with base parameters', () => {
		const expectedResult = 20675.23;
		const result = calculateContinuousItnCosts(
			5, // continuousDistributionCostPerITN
			10000, // population
			2, // peoplePerNet
			1.1, // procurementBuffer
			10 // itnCost
		);

		expect(result).toBeCloseTo(expectedResult, 2);
	});

	it('should scale linearly with population', () => {
		const result1 = calculateContinuousItnCosts(5, 10000, 2, 1.1, 10);
		const result2 = calculateContinuousItnCosts(5, 20000, 2, 1.1, 10);

		expect(result2).toBeCloseTo(result1 * 2, 2);
	});
});

describe('getFormCostOptions', () => {
	it('should convert form values to CostOptions', () => {
		const form: Record<string, FormValue> = {
			irs_household_annual_cost_product: '100',
			irs_household_annual_cost_deployment: '100',
			people_per_household: '5',
			population: '50000',
			lsm_cost: '2',
			py_only_cost: '5',
			py_pbo_cost: '7',
			py_pyrrole_cost: '8',
			py_ppf_cost: '9',
			mass_distribution_cost: '3',
			continuous_itn_distribution_cost: '2',
			procurement_buffer: '10',
			people_per_bednet: '2',
			routine_coverage: true
		};

		const result = getFormCostOptions(form);

		expect(result).toEqual({
			irsAnnualCostPerHouseholdProduct: 100,
			irsAnnualCostPerHouseholdDeployment: 100,
			peoplePerHousehold: 5,
			population: 50000,
			lsmCostPerPerson: 2,
			itnCosts: {
				pyOnly: 5,
				pyPbo: 7,
				pyPyrrole: 8,
				pyPpf: 9
			},
			massDistributionCostPerITN: 3,
			continuousDistributionCostPerITN: 2,
			procurementBuffer: 1.1,
			peoplePerNet: 2,
			isRoutine: true
		});
	});
});

describe('getIrsTotalCost', () => {
	it('should calculate IRS total cost correctly', () => {
		const costOptions: CostOptions = {
			irsAnnualCostPerHouseholdProduct: 100,
			irsAnnualCostPerHouseholdDeployment: 100,
			peoplePerHousehold: 5,
			population: 50000,
			lsmCostPerPerson: 0,
			itnCosts: { pyOnly: 0, pyPbo: 0, pyPyrrole: 0, pyPpf: 0 },
			massDistributionCostPerITN: 0,
			continuousDistributionCostPerITN: 0,
			procurementBuffer: 1,
			peoplePerNet: 1,
			isRoutine: false
		};

		const result = getIrsTotalCost(costOptions);
		const expectedHouseholds = 50000 / 5;
		const expected = POST_INTERVENTION_YEARS.length * (100 + 100) * expectedHouseholds;

		expect(result).toBe(expected);
	});
});

describe('getLsmTotalCost', () => {
	it('should calculate LSM total cost correctly', () => {
		const costOptions: CostOptions = {
			irsAnnualCostPerHouseholdProduct: 0,
			irsAnnualCostPerHouseholdDeployment: 0,
			peoplePerHousehold: 1,
			population: 50000,
			lsmCostPerPerson: 2.5,
			itnCosts: { pyOnly: 0, pyPbo: 0, pyPyrrole: 0, pyPpf: 0 },
			massDistributionCostPerITN: 0,
			continuousDistributionCostPerITN: 0,
			procurementBuffer: 1,
			peoplePerNet: 1,
			isRoutine: false
		};

		const result = getLsmTotalCost(costOptions);

		expect(result).toBe(125000);
	});
});

describe('getItnTotalCost', () => {
	const baseCostOptions: CostOptions = {
		irsAnnualCostPerHouseholdProduct: 0,
		irsAnnualCostPerHouseholdDeployment: 0,
		peoplePerHousehold: 1,
		population: 10000,
		lsmCostPerPerson: 0,
		itnCosts: {
			pyOnly: 5,
			pyPbo: 7,
			pyPyrrole: 8,
			pyPpf: 9
		},
		massDistributionCostPerITN: 3,
		continuousDistributionCostPerITN: 2,
		procurementBuffer: 1.1,
		peoplePerNet: 2,
		isRoutine: false
	};

	it('should calculate mass distribution only when not routine', () => {
		const result = getItnTotalCost(baseCostOptions, 'pyOnly');

		expect(result).toBeGreaterThan(0);
	});

	it('should include continuous costs when routine is true', () => {
		const routineCostOptions = { ...baseCostOptions, isRoutine: true };
		const massOnly = getItnTotalCost(baseCostOptions, 'pyOnly');
		const withRoutine = getItnTotalCost(routineCostOptions, 'pyOnly');

		expect(withRoutine).toBeGreaterThan(massOnly);
	});
});

describe('getScenarioCostCalculators', () => {
	const costOptions: CostOptions = {
		irsAnnualCostPerHouseholdProduct: 100,
		irsAnnualCostPerHouseholdDeployment: 100,
		peoplePerHousehold: 5,
		population: 10000,
		lsmCostPerPerson: 2,
		itnCosts: {
			pyOnly: 5,
			pyPbo: 7,
			pyPyrrole: 8,
			pyPpf: 9
		},
		massDistributionCostPerITN: 3,
		continuousDistributionCostPerITN: 2,
		procurementBuffer: 1.1,
		peoplePerNet: 2,
		isRoutine: false
	};

	it('should return calculators for all scenarios', () => {
		const calculators = getScenarioCostCalculators(costOptions);

		expect(calculators).toHaveProperty('irs_only');
		expect(calculators).toHaveProperty('lsm_only');
		expect(calculators).toHaveProperty('py_only_only');
		expect(calculators).toHaveProperty('py_pbo_only');
		expect(calculators).toHaveProperty('py_pyrrole_only');
		expect(calculators).toHaveProperty('py_ppf_only');
		expect(calculators).toHaveProperty('py_only_with_lsm');
		expect(calculators).toHaveProperty('py_pbo_with_lsm');
		expect(calculators).toHaveProperty('py_pyrrole_with_lsm');
		expect(calculators).toHaveProperty('py_ppf_with_lsm');
		expect(calculators).toHaveProperty('no_intervention');
	});

	it('should return zero for no_intervention', () => {
		const calculators = getScenarioCostCalculators(costOptions);

		expect(calculators.no_intervention()).toBe(0);
	});

	it('should calculate combined costs for ITN with LSM scenarios', () => {
		const calculators = getScenarioCostCalculators(costOptions);
		const lsmCost = calculators.lsm_only();
		const pyOnlyCost = calculators.py_only_only();
		const combinedCost = calculators.py_only_with_lsm();

		expect(combinedCost).toBeCloseTo(lsmCost + pyOnlyCost, 2);
	});
});

describe('getTotalCostsPerScenario', () => {
	const form: Record<string, FormValue> = {
		irs_household_annual_cost: '100',
		people_per_household: '5',
		population: '10000',
		lsm_cost: '2',
		py_only_cost: '5',
		py_pbo_cost: '7',
		py_pyrrole_cost: '8',
		py_ppf_cost: '9',
		mass_distribution_cost: '3',
		continuous_itn_distribution_cost: '2',
		procurement_buffer: '10',
		people_per_bednet: '2',
		routine_coverage: false
	};

	it('should calculate costs for provided scenarios', () => {
		const scenarios: Scenario[] = ['irs_only', 'lsm_only', 'no_intervention'];
		const result = getTotalCostsPerScenario(scenarios, form);

		expect(result).toHaveProperty('irs_only');
		expect(result).toHaveProperty('lsm_only');
		expect(result).toHaveProperty('no_intervention');
		expect(result.no_intervention).toBe(0);
	});

	it('should only include requested scenarios', () => {
		const scenarios: Scenario[] = ['irs_only'];
		const result = getTotalCostsPerScenario(scenarios, form);

		expect(Object.keys(result)).toHaveLength(1);
		expect(result).toHaveProperty('irs_only');
	});
});

describe('combineCostsAndCasesAverted', () => {
	it('should combine costs and cases averted for matching scenarios', () => {
		const totalCosts: Partial<Record<Scenario, number>> = {
			irs_only: 1000,
			lsm_only: 2000
		};
		const casesAverted = {
			irs_only: { casesAvertedYear1Per1000: 100 },
			lsm_only: { casesAvertedYear1Per1000: 200 }
		} as Partial<Record<Scenario, CasesAverted>>;

		const result = combineCostsAndCasesAverted(totalCosts, casesAverted);

		expect(result).toEqual({
			irs_only: {
				totalCost: 1000,
				casesAverted: { casesAvertedYear1Per1000: 100 }
			},
			lsm_only: {
				totalCost: 2000,
				casesAverted: { casesAvertedYear1Per1000: 200 }
			}
		});
	});

	it('should exclude scenarios missing cases averted', () => {
		const totalCosts: Partial<Record<Scenario, number>> = {
			irs_only: 1000,
			lsm_only: 2000
		};
		const casesAverted = {
			irs_only: { casesAvertedYear1Per1000: 100 }
		} as Partial<Record<Scenario, CasesAverted>>;

		const result = combineCostsAndCasesAverted(totalCosts, casesAverted);

		expect(result).toHaveProperty('irs_only');
		expect(result).not.toHaveProperty('lsm_only');
	});

	it('should exclude scenarios missing total costs', () => {
		const totalCosts: Partial<Record<Scenario, number>> = {
			irs_only: 1000
		};
		const casesAverted = {
			irs_only: { casesAvertedYear1Per1000: 100 }
		} as Partial<Record<Scenario, CasesAverted>>;

		const result = combineCostsAndCasesAverted(totalCosts, casesAverted);

		expect(result).toHaveProperty('irs_only');
		expect(result).not.toHaveProperty('lsm_only');
	});

	it('should return empty object when no matching scenarios', () => {
		const totalCosts: Partial<Record<Scenario, number>> = {
			irs_only: 1000
		};
		const casesAverted = {
			lsm_only: { casesAvertedYear1Per1000: 100 }
		} as Partial<Record<Scenario, CasesAverted>>;

		const result = combineCostsAndCasesAverted(totalCosts, casesAverted);

		expect(result).toEqual({});
	});
});

describe('calculateItnDistributionCosts', () => {
	it('should calculate ITN distribution costs correctly', () => {
		const expectedCost = 71500;
		const result = calculateItnDistributionCosts(
			3, // distributionCostPerITN
			10000, // population
			10, // itnCost
			2, // peoplePerNet
			1.1 // procurementBuffer
		);

		expect(result).toBeCloseTo(expectedCost, 2);
	});
});
