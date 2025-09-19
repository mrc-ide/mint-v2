import type { FormValue } from '$lib/components/dynamic-region-form/types';
import type { Scenario } from '$lib/types/userState';

export const DEFAULT_POPULATION = 20000;
export const DEFAULT_PEOPLE_PER_HOUSEHOLD = 4;
export const DEFAULT_IRS_COST_PER_HOUSEHOLD = 20;
export const DEFAULT_LSM_COST_PER_PERSON = 5;
export const DEFAULT_ITN_COSTS = {
	pyOnly: 1.85,
	pyPbo: 2.14,
	pyPyrrole: 2.56,
	pyPpf: 2.86
} as const;
export const DEFAULT_MASS_DISTRIBUTION_COST_PER_PERSON = 2.75;
export const DEFAULT_CONTINUOUS_DISTRIBUTION_COST_PER_PERSON = 2.75;
export const DEFAULT_PEOPLE_PER_NET = 1.8;

export interface CostOptions {
	irsAnnualCostPerHousehold: number;
	peoplePerHousehold: number;
	population: number;
	lsmCostPerPerson: number;
	itnCosts: {
		pyOnly: number;
		pyPbo: number;
		pyPyrrole: number;
		pyPpf: number;
	};
	massDistributionCostPerPerson: number;
	continuousDistributionCostPerPerson: number;
	procurementBuffer: number;
	peoplePerNet: number;
	isRoutine: boolean;
}

export const getFormCostOptions = (form: Record<string, FormValue>): CostOptions => ({
	irsAnnualCostPerHousehold: Number(form['irs_household_annual_cost'] ?? DEFAULT_IRS_COST_PER_HOUSEHOLD),
	peoplePerHousehold: Number(form['people_per_household'] ?? DEFAULT_PEOPLE_PER_HOUSEHOLD),
	population: Number(form['population'] ?? DEFAULT_POPULATION),
	lsmCostPerPerson: Number(form['lsm_cost'] ?? DEFAULT_LSM_COST_PER_PERSON),
	itnCosts: {
		pyOnly: Number(form['py_only_cost'] ?? DEFAULT_ITN_COSTS.pyOnly),
		pyPbo: Number(form['py_pbo_cost'] ?? DEFAULT_ITN_COSTS.pyPbo),
		pyPyrrole: Number(form['py_pyrrole_cost'] ?? DEFAULT_ITN_COSTS.pyPyrrole),
		pyPpf: Number(form['py_ppf_cost'] ?? DEFAULT_ITN_COSTS.pyPpf)
	},
	massDistributionCostPerPerson: Number(form['mass_distribution_cost'] ?? DEFAULT_MASS_DISTRIBUTION_COST_PER_PERSON),
	continuousDistributionCostPerPerson: Number(
		form['continuous_itn_distribution_cost'] ?? DEFAULT_CONTINUOUS_DISTRIBUTION_COST_PER_PERSON
	),
	procurementBuffer: 1 + Number(form['procurement_buffer'] ?? 0) / 100, // convert percentage to multiplier
	peoplePerNet: Number(form['people_per_bednet'] ?? DEFAULT_PEOPLE_PER_NET),
	isRoutine: Boolean(form['routine_coverage'])
});

export const getIrsTotalCost = ({ irsAnnualCostPerHousehold, population, peoplePerHousehold }: CostOptions): number =>
	3 * irsAnnualCostPerHousehold * (population / peoplePerHousehold);

export const getLsmTotalCost = ({ lsmCostPerPerson, population }: CostOptions): number => lsmCostPerPerson * population;

export const getItnTotalCost = (
	{ itnCosts, population, peoplePerNet, isRoutine, procurementBuffer }: CostOptions,
	itnType: keyof CostOptions['itnCosts']
): number => {
	const massCosts =
		(itnCosts[itnType] * population + (itnCosts[itnType] * population) / peoplePerNet) * procurementBuffer;
	const continuousCosts = isRoutine
		? 0.15 * (itnCosts[itnType] * population + (itnCosts[itnType] * population) / peoplePerNet) * procurementBuffer
		: 0;

	return massCosts + continuousCosts;
};

export const getScenarioCalculators = (costOptions: CostOptions): Record<Scenario, () => number> => ({
	irs_only: () => getIrsTotalCost(costOptions),
	lsm_only: () => getLsmTotalCost(costOptions),
	py_only_only: () => getItnTotalCost(costOptions, 'pyOnly'),
	py_pbo_only: () => getItnTotalCost(costOptions, 'pyPbo'),
	py_pyrrole_only: () => getItnTotalCost(costOptions, 'pyPyrrole'),
	py_ppf_only: () => getItnTotalCost(costOptions, 'pyPpf'),
	py_only_with_lsm: () => getItnTotalCost(costOptions, 'pyOnly') + getLsmTotalCost(costOptions),
	py_pbo_with_lsm: () => getItnTotalCost(costOptions, 'pyPbo') + getLsmTotalCost(costOptions),
	py_pyrrole_with_lsm: () => getItnTotalCost(costOptions, 'pyPyrrole') + getLsmTotalCost(costOptions),
	py_ppf_with_lsm: () => getItnTotalCost(costOptions, 'pyPpf') + getLsmTotalCost(costOptions),
	no_intervention: () => 0
});

export const getTotalCostsPerScenario = (
	scenarios: Scenario[],
	form: Record<string, FormValue>
): Partial<Record<Scenario, number>> => {
	const costOptions = getFormCostOptions(form);
	console.log('Cost Options:', costOptions);
	const scenarioCalculators = getScenarioCalculators(costOptions);

	return scenarios.reduce(
		(costs, scenario) => ({
			...costs,
			[scenario]: scenarioCalculators[scenario]()
		}),
		{} as Partial<Record<Scenario, number>>
	);
};
