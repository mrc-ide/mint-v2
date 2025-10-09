import type { FormValue } from '$lib/components/dynamic-region-form/types';
import { POST_INTERVENTION_YEARS, type Scenario } from '$lib/types/userState';
import type { CasesAverted } from './processCases';

/** Cost options for the various interventions */
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
	irsAnnualCostPerHousehold: Number(form['irs_household_annual_cost']),
	peoplePerHousehold: Number(form['people_per_household']),
	population: Number(form['population']),
	lsmCostPerPerson: Number(form['lsm_cost']),
	itnCosts: {
		pyOnly: Number(form['py_only_cost']),
		pyPbo: Number(form['py_pbo_cost']),
		pyPyrrole: Number(form['py_pyrrole_cost']),
		pyPpf: Number(form['py_ppf_cost'])
	},
	massDistributionCostPerPerson: Number(form['mass_distribution_cost']),
	continuousDistributionCostPerPerson: Number(form['continuous_itn_distribution_cost']),
	procurementBuffer: 1 + Number(form['procurement_buffer']) / 100, // convert percentage to multiplier
	peoplePerNet: Number(form['people_per_bednet']),
	isRoutine: Boolean(form['routine_coverage'])
});

export const getIrsTotalCost = ({ irsAnnualCostPerHousehold, population, peoplePerHousehold }: CostOptions): number =>
	POST_INTERVENTION_YEARS.length * irsAnnualCostPerHousehold * (population / peoplePerHousehold);

export const getLsmTotalCost = ({ lsmCostPerPerson, population }: CostOptions): number => lsmCostPerPerson * population;

const calculateItnDistributionCosts = (
	distributionCostPerPerson: number,
	population: number,
	bedNetCost: number,
	procurementBuffer: number
): number => (distributionCostPerPerson * population + bedNetCost) * procurementBuffer;

export const calculateBedNetCost = (itnCost: number, population: number, peoplePerNet: number): number =>
	(itnCost * population) / peoplePerNet;

export const getItnTotalCost = (
	{
		itnCosts,
		population,
		peoplePerNet,
		isRoutine,
		procurementBuffer,
		massDistributionCostPerPerson,
		continuousDistributionCostPerPerson
	}: CostOptions,
	itnType: keyof CostOptions['itnCosts']
): number => {
	const bedNetCost = calculateBedNetCost(itnCosts[itnType], population, peoplePerNet);

	const massCosts = calculateItnDistributionCosts(
		massDistributionCostPerPerson,
		population,
		bedNetCost,
		procurementBuffer
	);
	const continuousCosts = isRoutine
		? 0.15 *
			calculateItnDistributionCosts(continuousDistributionCostPerPerson, population, bedNetCost, procurementBuffer)
		: 0;

	return massCosts + continuousCosts;
};

export const getScenarioCostCalculators = (costOptions: CostOptions): Record<Scenario, () => number> => ({
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
	const scenarioCostCalculators = getScenarioCostCalculators(costOptions);

	return scenarios.reduce(
		(costs, scenario) => ({
			...costs,
			[scenario]: scenarioCostCalculators[scenario]()
		}),
		{} as Partial<Record<Scenario, number>>
	);
};

export interface CostCasesAndAverted {
	totalCost: number;
	casesAverted: CasesAverted;
}

export const combineCostsAndCasesAverted = (
	totalCosts: Partial<Record<Scenario, number>>,
	casesAverted: Partial<Record<Scenario, CasesAverted>>
): Partial<Record<Scenario, CostCasesAndAverted>> =>
	Object.fromEntries(
		(Object.keys(totalCosts) as Scenario[])
			.filter((scenario) => totalCosts[scenario] !== undefined && casesAverted[scenario])
			.map((scenario) => [scenario, { totalCost: totalCosts[scenario], casesAverted: casesAverted[scenario] }])
	);
