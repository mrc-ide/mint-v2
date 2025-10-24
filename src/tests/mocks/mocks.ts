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
	}
]);
export const MOCK_PREVALENCE_DATA = Object.freeze([
	{
		prevalence: 0.5546,
		scenario: 'no_intervention',
		days: 60
	},
	{
		prevalence: 0.5728,
		scenario: 'no_intervention',
		days: 120
	},
	{
		prevalence: 0.58,
		scenario: 'no_intervention',
		days: 180
	},
	{
		prevalence: 0.5975,
		scenario: 'no_intervention',
		days: 240
	},
	{
		prevalence: 0.5604,
		scenario: 'no_intervention',
		days: 300
	},
	{
		prevalence: 0.5878,
		scenario: 'no_intervention',
		days: 360
	},
	{
		prevalence: 0.6152,
		scenario: 'no_intervention',
		days: 420
	},
	{
		prevalence: 0.6358,
		scenario: 'no_intervention',
		days: 480
	},
	{
		prevalence: 0.6462,
		scenario: 'no_intervention',
		days: 540
	},
	{
		prevalence: 0.666,
		scenario: 'no_intervention',
		days: 600
	},
	{
		prevalence: 0.6481,
		scenario: 'no_intervention',
		days: 660
	},
	{
		prevalence: 0.6021,
		scenario: 'no_intervention',
		days: 720
	},
	{
		prevalence: 0.6144,
		scenario: 'no_intervention',
		days: 780
	},
	{
		prevalence: 0.6293,
		scenario: 'no_intervention',
		days: 840
	},
	{
		prevalence: 0.6385,
		scenario: 'no_intervention',
		days: 900
	},
	{
		prevalence: 0.6465,
		scenario: 'no_intervention',
		days: 960
	},
	{
		prevalence: 0.6429,
		scenario: 'no_intervention',
		days: 1020
	},
	{
		prevalence: 0.6023,
		scenario: 'no_intervention',
		days: 1080
	},
	{
		prevalence: 0.6088,
		scenario: 'no_intervention',
		days: 1140
	},
	{
		prevalence: 0.6085,
		scenario: 'no_intervention',
		days: 1200
	},
	{
		prevalence: 0.6122,
		scenario: 'no_intervention',
		days: 1260
	},
	{
		prevalence: 0.6269,
		scenario: 'no_intervention',
		days: 1320
	},
	{
		prevalence: 0.6294,
		scenario: 'no_intervention',
		days: 1380
	},
	{
		prevalence: 0.5988,
		scenario: 'no_intervention',
		days: 1440
	},
	{
		prevalence: 0.5546,
		scenario: 'irs_only',
		days: 60
	},
	{
		prevalence: 0.5728,
		scenario: 'irs_only',
		days: 120
	},
	{
		prevalence: 0.58,
		scenario: 'irs_only',
		days: 180
	},
	{
		prevalence: 0.5975,
		scenario: 'irs_only',
		days: 240
	},
	{
		prevalence: 0.5604,
		scenario: 'irs_only',
		days: 300
	},
	{
		prevalence: 0.5481,
		scenario: 'irs_only',
		days: 360
	},
	{
		prevalence: 0.4138,
		scenario: 'irs_only',
		days: 420
	},
	{
		prevalence: 0.3194,
		scenario: 'irs_only',
		days: 480
	},
	{
		prevalence: 0.2764,
		scenario: 'irs_only',
		days: 540
	},
	{
		prevalence: 0.2561,
		scenario: 'irs_only',
		days: 600
	},
	{
		prevalence: 0.2483,
		scenario: 'irs_only',
		days: 660
	},
	{
		prevalence: 0.2499,
		scenario: 'irs_only',
		days: 720
	},
	{
		prevalence: 0.2226,
		scenario: 'irs_only',
		days: 780
	},
	{
		prevalence: 0.1742,
		scenario: 'irs_only',
		days: 840
	},
	{
		prevalence: 0.1507,
		scenario: 'irs_only',
		days: 900
	},
	{
		prevalence: 0.1526,
		scenario: 'irs_only',
		days: 960
	},
	{
		prevalence: 0.1681,
		scenario: 'irs_only',
		days: 1020
	},
	{
		prevalence: 0.1923,
		scenario: 'irs_only',
		days: 1080
	},
	{
		prevalence: 0.1985,
		scenario: 'irs_only',
		days: 1140
	},
	{
		prevalence: 0.1452,
		scenario: 'irs_only',
		days: 1200
	},
	{
		prevalence: 0.1253,
		scenario: 'irs_only',
		days: 1260
	},
	{
		prevalence: 0.1227,
		scenario: 'irs_only',
		days: 1320
	},
	{
		prevalence: 0.1411,
		scenario: 'irs_only',
		days: 1380
	},
	{
		prevalence: 0.1706,
		scenario: 'irs_only',
		days: 1440
	}
]);

export const MOCK_FORM_SCHEMA = Object.freeze({
	groups: [
		{
			id: 'baseline_options',
			title: 'Baseline Options',
			description: 'These are the baseline options for the form.',
			helpText: 'Configure the baseline options for the form.',
			collapsible: true,
			triggersRun: true,
			preRun: true,
			subGroups: [
				{
					id: 'site_inputs',
					title: 'Site Inputs',
					description: 'Configure the site-specific inputs for the form.',
					helpText: 'These inputs are specific to the site being configured.',
					fields: [
						{
							id: 'population',
							label: 'Size of population',
							helpText: 'Enter the size of the population in the region.',
							type: 'number',
							required: true,
							default: 20000,
							min: 0,
							max: 1000000000,
							step: 100,
							integer: true
						},
						{
							id: 'is_seasonal',
							label: 'Seasonal transmission',
							helpText: 'Indicate whether the population is seasonal.',
							type: 'toggle',
							required: true,
							default: false
						}
					]
				},
				{
					id: 'past_vector_control',
					title: 'Past Vector Control',
					helpText: 'Configure the past vector control measures in the region.',
					description: 'These inputs are specific to the past vector control measures in the region.',
					collapsible: true,
					fields: [
						{
							id: 'py_only',
							label: 'Pyrethroid ITN population usage',
							helpText: 'Indicate the population usage of pyrethroid ITNs.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						},
						{
							id: 'py_pbo',
							label: 'Pyrethroid-PBO ITN population usage',
							helpText: 'Indicate the population usage of pyrethroid-PBO ITNs.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						},
						{
							id: 'py_pyrrole',
							label: 'Pyrethroid-Pyrrole ITN population usage',
							helpText: 'Indicate the population usage of pyrethroid-Pyrrole ITNs.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						},
						{
							id: 'py_ppf',
							label: 'Pyrethroid-pyriproxyfen ITN population usage',
							helpText: 'Indicate the population usage of Pyrethroid-pyriproxyfen ITNs.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						},
						{
							id: 'itn_total',
							label: 'Total ITN population usage',
							type: 'display',
							unit: '%',
							value: {
								type: 'cross_field',
								fields: ['py_only', 'py_pbo', 'py_pyrrole', 'py_ppf'],
								operator: 'sum'
							}
						}
					]
				}
			]
		},
		{
			id: 'intervention_options',
			title: 'Intervention Options',
			triggersRun: true,
			collapsible: true,
			preRun: false,
			description: 'These are the intervention options for the form.',
			helpText: 'Configure the intervention options for the form.',
			subGroups: [
				{
					id: 'future_intervention',
					title: 'Future Intervention Options',
					helpText: 'Configure the future intervention options for the form.',
					description: 'These inputs are specific to the future intervention options in the region.',
					collapsible: true,
					fields: [
						{
							id: 'itn_future',
							label: 'Expected ITN population use',
							helpText: 'Indicate the expected ITN population use in the region.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						},
						{
							id: 'itn_future_types',
							label: 'Future ITN Types',
							helpText:
								'Select the type of ITNs that will be used in the future. This field becomes enabled when Expected ITN population use > 0.',
							type: 'multiselect',
							disabled: {
								type: 'cross_field',
								fields: ['itn_future'],
								operator: 'falsy'
							},
							options: [
								{ label: 'Pyrethroid ITNs', value: 'py_only' },
								{ label: 'Pyrethroid-PBO ITNs', value: 'py_pbo' },
								{ label: 'Pyrethroid-Pyrrole ITNs', value: 'py_pyrrole' },
								{ label: 'Pyrethroid-Pyriproxyfen ITNs', value: 'py_ppf' }
							]
						},
						{
							id: 'routine_coverage',
							label: 'Continuous distribution of ITNs',
							helpText:
								'Indicate whether continuous distribution of ITNs will be implemented. This field becomes enabled when Expected ITN population use > 0.',
							type: 'toggle',
							required: true,
							disabled: {
								type: 'cross_field',
								fields: ['itn_future'],
								operator: 'falsy'
							},
							default: false
						}
					]
				}
			]
		},
		{
			id: 'cost_options',
			title: 'Cost Options',
			description: 'Cost Options',
			helpText: 'Configure the cost options for the form.',
			triggersRun: false,
			collapsible: true,
			preRun: false,
			subGroups: [
				{
					id: 'procurement_distribution',
					title: 'Procurement and Distribution Costs',
					description: 'Configure the procurement and distribution costs for the form.',
					helpText: 'These inputs are specific to the procurement and distribution costs in the region.',
					collapsible: true,
					fields: [
						{
							id: 'people_per_bednet',
							label: 'Number of People per bed net',
							helpText: 'When planning procurement, what number of people per net is used?',
							type: 'number',
							required: true,
							default: 1.8,
							step: 0.1
						},
						{
							id: 'people_per_household',
							label: 'Number of People per household',
							helpText: 'When planning procurement, what number of people per household is used?',
							type: 'number',
							required: true,
							default: 4,
							step: 1
						},
						{
							id: 'procurement_buffer',
							label: 'Procurement Buffer',
							helpText: 'When planning procurement, what buffer is used?',
							type: 'slider',
							required: true,
							default: 7,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							integer: true
						}
					]
				}
			]
		}
	],
	customValidationRules: {
		itn_total_under_100: {
			type: 'cross_field',
			fields: ['py_only', 'py_pbo', 'py_pyrrole', 'py_ppf'],
			operator: 'sum_lte',
			threshold: 100,
			errorFields: ['itn_total'],
			message: 'Total ITN population usage must be less than or equal to 100%.'
		}
	}
});
