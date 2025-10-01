import { z } from 'zod';
export const strategiseSchema = z.object({
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
});

export type StrategiseForm = z.infer<typeof strategiseSchema>;
export type StrategiseRegions = z.infer<typeof strategiseSchema>['regionalStrategies'];
