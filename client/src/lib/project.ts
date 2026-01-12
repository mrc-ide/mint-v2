import type { Region } from './types/userState';

export const mapRegionsToPopulation = (regions: Region[]) => {
	return Object.fromEntries(regions.map((region) => [region.name, Number(region.formValues['population'])]));
};
