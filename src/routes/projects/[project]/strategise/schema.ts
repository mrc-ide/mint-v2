import { z } from 'zod';
export const strategiseSchema = z
	.object({
		minCost: z.number().min(1, 'Minimum cost must be greater than 0'),
		maxCost: z.number().min(1, 'Maximum cost must be greater than 0'),
		budget: z.number().min(1, 'Budget must be greater than 0'),
		regionalStrategies: z
			.object({
				region: z.string(),
				interventions: z
					.object({
						intervention: z.string(),
						cost: z.number().min(0, 'Cost must be 0 or greater'),
						casesAverted: z.number()
					})
					.array()
					.min(1, 'Select at least one intervention')
			})
			.array()
	})
	.refine((data) => data.budget >= data.minCost && data.budget <= data.maxCost, {
		message: 'Budget must be between minimum and maximum cost',
		path: ['budget']
	});

export type StrategiseForm = z.infer<typeof strategiseSchema>;
export type StrategiseRegions = z.infer<typeof strategiseSchema>['regionalStrategies'];
