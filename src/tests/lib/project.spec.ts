import { mapRegionsToPopulation } from '$lib/project';
import type { Region } from '$lib/types/userState';

describe('mapRegionsToPopulation', () => {
	it('should convert region populations to numbers', () => {
		const regions = [
			{ name: 'A', formValues: { population: '100' } },
			{ name: 'B', formValues: { population: '200' } },
			{ name: 'C', formValues: {} }
		] as Region[];

		const result = mapRegionsToPopulation(regions);

		expect(result).toEqual({
			A: 100,
			B: 200,
			C: NaN
		});
	});
});
