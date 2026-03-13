import type { Scenario } from '$lib/types/userState';
import { z } from 'zod';

const strategiseResultsSchema = z
	.object({
		costThreshold: z.number().min(0, 'Cost threshold must be 0 or greater'),
		interventions: z
			.object({
				intervention: z.custom<Scenario>(),
				cost: z.number().min(0, 'Cost must be 0 or greater'),
				casesAverted: z.number(),
				region: z.string()
			})
			.array()
	})
	.array();
// TODO: can make schema same just change casesAverted to cases and then transform in utils
export const strategiseSchema = z
	.object({
		minCost: z.number().min(1, 'Minimum cost must be greater than 0'),
		maxCost: z.number().min(1, 'Maximum cost must be greater than 0'),
		budget: z.number().min(1, 'Budget must be greater than 0'),
		strategiseResults: z
			.object({
				costThreshold: z.number().min(0, 'Cost threshold must be 0 or greater'),
				interventions: z
					.object({
						intervention: z.custom<Scenario>(),
						cost: z.number().min(0, 'Cost must be 0 or greater'),
						casesAverted: z.number(),
						region: z.string()
					})
					.array()
			})
			.array(),
		compareStrategiseResults: z
			.object({
				present: strategiseResultsSchema,
				longTerm: strategiseResultsSchema
			})
			.optional()
	})
	.refine((data) => data.budget > data.minCost && data.budget <= data.maxCost, {
		message: 'Budget must be between minimum and maximum cost',
		path: ['budget']
	});

export type StrategiseForm = z.infer<typeof strategiseSchema>;

interface StrategiseRegion {
	region: string;
	interventions: {
		intervention: Scenario;
		cost: number;
		casesAverted: number;
	}[];
}
export type StrategiseRegions = StrategiseRegion[];

interface CompareStrategiseRegion {
	region: string;
	interventions: {
		intervention: Scenario;
		cost: number;
		cases: number;
	}[];
}
export interface CompareStrategiseRegions {
	present: CompareStrategiseRegion[];
	longTerm: CompareStrategiseRegion[];
}
