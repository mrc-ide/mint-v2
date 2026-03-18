import type { Scenario } from '$lib/types/userState';
import { z } from 'zod';

export const compareStrategiseResultSchema = z
	.object({
		costThreshold: z.number().min(0, 'Cost threshold must be 0 or greater'),
		interventions: z
			.object({
				intervention: z.custom<Scenario>(),
				cost: z.number().min(0, 'Cost must be 0 or greater'),
				cases: z.number(),
				region: z.string()
			})
			.array()
	})
	.array();

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
				present: compareStrategiseResultSchema,
				longTerm: compareStrategiseResultSchema
			})
			.optional()
	})
	.refine((data) => data.budget > data.minCost && data.budget <= data.maxCost, {
		message: 'Budget must be between minimum and maximum cost',
		path: ['budget']
	});

export type StrategiseForm = z.infer<typeof strategiseSchema>;

type MetricKey = 'cases' | 'casesAverted';

type StrategiseIntervention<K extends MetricKey> = {
	intervention: Scenario;
	cost: number;
} & Record<K, number>;

export type StrategiseRegionByMetric<TMetric extends MetricKey> = {
	region: string;
	interventions: StrategiseIntervention<TMetric>[];
};

export interface CompareStrategiseRegions {
	present: StrategiseRegionByMetric<'cases'>[];
	longTerm: StrategiseRegionByMetric<'cases'>[];
}
