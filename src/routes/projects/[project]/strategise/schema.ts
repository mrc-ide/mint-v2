import type { Scenario } from '$lib/types/userState';
import { z } from 'zod';
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
			.array()
	})
	.refine((data) => data.budget >= data.minCost && data.budget <= data.maxCost, {
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
