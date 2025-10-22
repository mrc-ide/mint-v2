export const MOCK_FORM_VALUES = Object.freeze({
	population: 20000,
	is_seasonal: true,
	current_malaria_prevalence: 54,
	preference_for_biting_in_bed: 82,
	preference_for_biting: 87,
	pyrethroid_resistance: 70,
	py_only: 0,
	py_pbo: 0,
	py_pyrrole: 0,
	py_ppf: 0,
	itn_total: null,
	irs_coverage: 22,
	itn_future: 53,
	itn_future_types: ['py_only', 'py_pyrrole', 'py_pbo', 'py_ppf'],
	routine_coverage: true,
	irs_future: 42,
	lsm: 50,
	people_per_bednet: 1.8,
	people_per_household: 4,
	procurement_buffer: 7,
	py_only_cost: 1.85,
	py_pbo_cost: 2.14,
	py_pyrrole_cost: 2.56,
	py_ppf_cost: 2.86,
	mass_distribution_cost: 2.75,
	continuous_itn_distribution_cost: 2.75,
	irs_household_annual_cost: 20,
	lsm_cost: 5
});
export const MOCK_CASES_DATA = Object.freeze([
	{
		casesPer1000: 51.0108,
		scenario: 'no_intervention',
		year: 1
	},
	{
		casesPer1000: 84.0219,
		scenario: 'no_intervention',
		year: 2
	},
	{
		casesPer1000: 87.7515,
		scenario: 'no_intervention',
		year: 3
	},
	{
		casesPer1000: 82.4699,
		scenario: 'no_intervention',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'irs_only',
		year: 1
	},
	{
		casesPer1000: 25.1802,
		scenario: 'irs_only',
		year: 2
	},
	{
		casesPer1000: 24.2602,
		scenario: 'irs_only',
		year: 3
	},
	{
		casesPer1000: 28.1379,
		scenario: 'irs_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'lsm_only',
		year: 1
	},
	{
		casesPer1000: 55.8312,
		scenario: 'lsm_only',
		year: 2
	},
	{
		casesPer1000: 62.6143,
		scenario: 'lsm_only',
		year: 3
	},
	{
		casesPer1000: 65.2975,
		scenario: 'lsm_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_only_only',
		year: 1
	},
	{
		casesPer1000: 46.5906,
		scenario: 'py_only_only',
		year: 2
	},
	{
		casesPer1000: 76.699,
		scenario: 'py_only_only',
		year: 3
	},
	{
		casesPer1000: 84.8846,
		scenario: 'py_only_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_only_with_lsm',
		year: 1
	},
	{
		casesPer1000: 25.9631,
		scenario: 'py_only_with_lsm',
		year: 2
	},
	{
		casesPer1000: 49.9292,
		scenario: 'py_only_with_lsm',
		year: 3
	},
	{
		casesPer1000: 63.5311,
		scenario: 'py_only_with_lsm',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_pyrrole_only',
		year: 1
	},
	{
		casesPer1000: 29.8021,
		scenario: 'py_pyrrole_only',
		year: 2
	},
	{
		casesPer1000: 64.3978,
		scenario: 'py_pyrrole_only',
		year: 3
	},
	{
		casesPer1000: 82.9296,
		scenario: 'py_pyrrole_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_pyrrole_with_lsm',
		year: 1
	},
	{
		casesPer1000: 16.7779,
		scenario: 'py_pyrrole_with_lsm',
		year: 2
	},
	{
		casesPer1000: 39.2596,
		scenario: 'py_pyrrole_with_lsm',
		year: 3
	},
	{
		casesPer1000: 58.7735,
		scenario: 'py_pyrrole_with_lsm',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_pbo_only',
		year: 1
	},
	{
		casesPer1000: 34.1538,
		scenario: 'py_pbo_only',
		year: 2
	},
	{
		casesPer1000: 67.8504,
		scenario: 'py_pbo_only',
		year: 3
	},
	{
		casesPer1000: 84.0954,
		scenario: 'py_pbo_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_pbo_with_lsm',
		year: 1
	},
	{
		casesPer1000: 19.0498,
		scenario: 'py_pbo_with_lsm',
		year: 2
	},
	{
		casesPer1000: 42.4547,
		scenario: 'py_pbo_with_lsm',
		year: 3
	},
	{
		casesPer1000: 60.7343,
		scenario: 'py_pbo_with_lsm',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_ppf_only',
		year: 1
	},
	{
		casesPer1000: 45.1152,
		scenario: 'py_ppf_only',
		year: 2
	},
	{
		casesPer1000: 75.7246,
		scenario: 'py_ppf_only',
		year: 3
	},
	{
		casesPer1000: 84.8478,
		scenario: 'py_ppf_only',
		year: 4
	},
	{
		casesPer1000: 51.0108,
		scenario: 'py_ppf_with_lsm',
		year: 1
	},
	{
		casesPer1000: 25.1019,
		scenario: 'py_ppf_with_lsm',
		year: 2
	},
	{
		casesPer1000: 49.1111,
		scenario: 'py_ppf_with_lsm',
		year: 3
	},
	{
		casesPer1000: 63.2978,
		scenario: 'py_ppf_with_lsm',
		year: 4
	}
]);
