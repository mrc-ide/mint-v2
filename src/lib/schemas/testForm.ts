export const formSchema = {
	groups: [
		{
			id: 'baseline_options',
			title: 'Baseline Options',
			description: 'These are the baseline options for the form.',
			helpText: 'Configure the baseline options for the form.',
			collapsible: true,
			triggersRerun: true,
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
							max: 1e9,
							validation: {
								rules: ['integer'],
								message: 'Population must be an integer between 0 and 1 billion.'
							}
						},
						{
							id: 'is_seasonal',
							label: 'Is Seasonal?',
							helpText: 'Indicate whether the population is seasonal.',
							type: 'checkbox',
							required: true,
							default: false
						},
						{
							id: 'current_malaria_prevalence',
							label: 'Current Malaria Prevalence',
							helpText: 'Enter the current malaria prevalence in the region.',
							required: true,
							default: 0,
							type: 'slider',
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Current malaria prevalence must be an integer between 0 and 100.'
							}
						}
					]
				},
				{
					id: 'mosquito_inputs',
					title: 'Mosquito Inputs',
					description: 'These inputs are specific to the mosquito species in the region.',
					helpText: 'Configure the mosquito-specific inputs for the form.',
					fields: [
						{
							id: 'preference_for_biting_in_bed',
							label: 'Preference for biting in bed',
							helpText: "Indicate the mosquito's preference for biting in bed.",
							type: 'slider',
							required: true,
							default: 82,
							min: 40,
							max: 90,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Preference for biting in bed must be an integer between 40 and 90.'
							}
						},
						{
							id: 'preference_for_biting',
							label: 'Preference for biting',
							helpText: "Indicate the mosquito's preference for biting.",
							type: 'slider',
							required: true,
							default: 87,
							min: 60,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Preference for biting must be an integer between 60 and 100.'
							}
						},
						{
							id: 'pyrethroid_resistance',
							label: 'Pyrethroid Resistance',
							helpText: 'Indicate the level of pyrethroid resistance in the mosquito population.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Pyrethroid resistance must be an integer between 0 and 100.'
							}
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
							validation: {
								rules: ['integer'],
								message: 'Pyrethroid ITN population usage must be an integer between 0 and 100.',
								custom: ['itn_total_under_100']
							}
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
							validation: {
								rules: ['integer'],
								message: 'Pyrethroid-PBO ITN population usage must be an integer between 0 and 100.',
								custom: ['itn_total_under_100']
							}
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
							validation: {
								rules: ['integer'],
								message: 'Pyrethroid-Pyrrole ITN population usage must be an integer between 0 and 100.',
								custom: ['itn_total_under_100']
							}
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
							validation: {
								rules: ['integer'],
								message: 'Pyrethroid-pyriproxyfen ITN population usage must be an integer between 0 and 100.',
								custom: ['itn_total_under_100']
							}
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
						},
						{
							id: 'irs_coverage',
							label: 'IRS Coverage',
							helpText: 'Indicate the IRS coverage in the region.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'IRS coverage must be an integer between 0 and 100.'
							}
						}
					]
				}
			]
		},
		{
			id: 'intervention_options',
			title: 'Intervention Options',
			triggersRerun: true,
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
							validation: {
								rules: ['integer'],
								message: 'Expected ITN population use must be an integer between 0 and 100.'
							}
						},
						{
							id: 'itn_future_types',
							label: 'What type of ITNs will be used?',
							helpText: 'Select the type of ITNs that will be used in the future.',
							type: 'multiselect',
							options: [
								{
									label: 'Pyrethroid ITNs',
									value: 'py_only'
								},
								{
									label: 'Pyrethroid-PBO ITNs',
									value: 'py_pbo'
								},
								{
									label: 'Pyrethroid-Pyrrole ITNs',
									value: 'py_pyrrole'
								},
								{
									label: 'Pyrethroid-Pyriproxyfen ITNs',
									value: 'py_ppf'
								}
							]
						},
						{
							id: 'routine_coverage',
							label: 'Will continuous distribution of ITNs be used?',
							helpText: 'Indicate whether continuous distribution of ITNs will be implemented.',
							type: 'checkbox',
							required: true,
							disabled: {
								type: 'cross_field',
								fields: ['itn_future'],
								operator: 'falsy'
							},
							default: false
						},
						{
							id: 'irs_future',
							label: 'Expected IRS Coverage',
							helpText: 'Indicate the expected IRS coverage in the region.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Expected IRS coverage must be an integer between 0 and 100.'
							}
						},
						{
							id: 'lsm',
							label: 'Expected reduction in mosquito density from larval source management',
							helpText: 'Indicate the expected reduction in mosquito density from larval source management.',
							type: 'slider',
							required: true,
							default: 0,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message:
									'Expected reduction in mosquito density from larval source management must be an integer between 0 and 100.'
							}
						}
					]
				}
			]
		},
		{
			id: 'cost_options',
			description: 'Cost Options',
			title: 'Cost Options',
			helpText: 'Configure the cost options for the form.',
			triggersRerun: false,
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
							label: 'Number of People per Bed Net',
							helpText: 'When planning procurement, what number of people per net is used?',
							type: 'number',
							required: true,
							default: 1.8
						},
						{
							id: 'people_per_household',
							label: 'Number of People per Household',
							helpText: 'When planning procurement, what number of people per household is used?',
							type: 'number',
							required: true,
							default: 4
						},
						{
							id: 'procurement_buffer',
							label: 'Procurement Buffer (%)',
							helpText: 'When planning procurement, what buffer is used?',
							type: 'slider',
							required: true,
							default: 7,
							min: 0,
							max: 100,
							step: 1,
							unit: '%',
							validation: {
								rules: ['integer'],
								message: 'Procurement buffer must be an integer between 0 and 100.'
							}
						}
					]
				},
				{
					id: 'intervention_prices',
					title: 'Price of Interventions',
					description: 'Configure the prices for the interventions.',
					helpText: 'Specify the prices for each intervention.',
					collapsible: true,
					fields: [
						{
							id: 'py_only_cost',
							label: 'Price of Pyrethroid-Only ITNs ($USD)',
							type: 'number',
							required: true,
							default: 1.85
						},
						{
							id: 'py_pbo_cost',
							label: 'Price of Pyrethroid-PBO ITNs ($USD)',
							type: 'number',
							required: true,
							default: 2.14
						},
						{
							id: 'py_pyrrole_cost',
							label: 'Price of Pyrethroid-Pyrrole ITNs ($USD)',
							type: 'number',
							required: true,
							default: 2.56
						},
						{
							id: 'py_ppf_cost',
							label: 'Price of Pyrethroid-Pyriproxyfen ITNs ($USD)',
							type: 'number',
							required: true,
							default: 2.86
						},
						{
							id: 'mass_distribution_cost',
							label: 'ITN mass distribution campaign delivery cost per person ($USD)',
							type: 'number',
							required: true,
							default: 2.75
						},
						{
							id: 'continuous_itn_distribution_cost',
							label: 'Continuous ITN distribution campaign delivery cost per person ($USD)',
							type: 'number',
							required: true,
							default: 2.75
						},
						{
							id: 'irs_household_annual_cost',
							label: 'Annual cost of IRS per household structure ($USD)',
							type: 'number',
							required: true,
							default: 5.0
						},
						{
							id: 'lsm_cost',
							label: 'Cost of LSM programme per person ($USD)',
							type: 'number',
							required: true,
							default: 5.0
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
			message: 'Total ITN population usage must be less than or equal to 100%.'
		}
	}
};
