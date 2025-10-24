import type { Scenario } from '$lib/types/userState';
import { strategiseSchema } from '$routes/projects/[project]/strategise/schema';

describe('strategise schema', () => {
	it('should validate valid data with budget between minCost and maxCost', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 200,
					interventions: [
						{
							intervention: 'scenario1' as Scenario,
							cost: 150,
							casesAverted: 50,
							region: 'Region A'
						}
					]
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should reject when minCost is less than 1', () => {
		const invalidData = {
			minCost: 0,
			maxCost: 1000,
			budget: 500,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Minimum cost must be greater than 0');
		}
	});

	it('should reject when maxCost is less than 1', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 0,
			budget: 500,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Maximum cost must be greater than 0');
		}
	});

	it('should reject when budget is 0 or negative', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 1000,
			budget: 0,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Budget must be greater than 0');
		}
	});

	it('should reject when budget is not greater than minCost', () => {
		const invalidData = {
			minCost: 500,
			maxCost: 1000,
			budget: 500,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((issue) => issue.message === 'Budget must be between minimum and maximum cost')
			).toBe(true);
		}
	});

	it('should reject when budget is greater than maxCost', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 500,
			budget: 600,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((issue) => issue.message === 'Budget must be between minimum and maximum cost')
			).toBe(true);
		}
	});

	it('should allow budget equal to maxCost', () => {
		const validData = {
			minCost: 100,
			maxCost: 500,
			budget: 500,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should validate costThreshold of 0', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 0,
					interventions: []
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should reject negative costThreshold', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: -1,
					interventions: []
				}
			]
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Cost threshold must be 0 or greater');
		}
	});

	it('should validate intervention cost of 0', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 100,
					interventions: [
						{
							intervention: 'scenario1' as Scenario,
							cost: 0,
							casesAverted: 10,
							region: 'Region A'
						}
					]
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should reject negative intervention cost', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 100,
					interventions: [
						{
							intervention: 'scenario1' as Scenario,
							cost: -50,
							casesAverted: 10,
							region: 'Region A'
						}
					]
				}
			]
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Cost must be 0 or greater');
		}
	});

	it('should validate multiple strategise results with multiple interventions', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 200,
					interventions: [
						{
							intervention: 'scenario1' as Scenario,
							cost: 100,
							casesAverted: 30,
							region: 'Region A'
						},
						{
							intervention: 'scenario2' as Scenario,
							cost: 150,
							casesAverted: 45,
							region: 'Region B'
						}
					]
				},
				{
					costThreshold: 300,
					interventions: [
						{
							intervention: 'scenario3' as Scenario,
							cost: 200,
							casesAverted: 60,
							region: 'Region C'
						}
					]
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should validate empty strategiseResults array', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: []
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should validate empty interventions array', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 200,
					interventions: []
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should reject missing required fields', () => {
		const invalidData = {
			minCost: 100,
			maxCost: 1000
			// missing budget and strategiseResults
		};

		const result = strategiseSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('should allow negative casesAverted', () => {
		const validData = {
			minCost: 100,
			maxCost: 1000,
			budget: 500,
			strategiseResults: [
				{
					costThreshold: 100,
					interventions: [
						{
							intervention: 'scenario1' as Scenario,
							cost: 50,
							casesAverted: -10,
							region: 'Region A'
						}
					]
				}
			]
		};

		const result = strategiseSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});
});
