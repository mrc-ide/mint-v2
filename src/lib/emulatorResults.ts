import type { Scenario } from './types/userState';

export const ScenarioToLegend: Record<Scenario, string> = {
	no_intervention: 'No Intervention',
	irs_only: 'IRS Only',
	lsm_only: 'LSM Only',
	py_only_only: 'Pyrethroid ITN (Only)',
	py_only_with_lsm: 'Pyrethroid ITN (with LSM)',
	py_pbo_only: 'Pyrethroid-PBO (Only)',
	py_pbo_with_lsm: 'Pyrethroid-PBO (with LSM)',
	py_pyrrole_only: 'Pyrethroid-Pyrrole (Only)',
	py_pyrrole_with_lsm: 'Pyrethroid-Pyrrole (with LSM)',
	py_ppf_only: 'Pyrethroid-PPF (Only)',
	py_ppf_with_lsm: 'Pyrethroid-PPF (with LSM)'
};
