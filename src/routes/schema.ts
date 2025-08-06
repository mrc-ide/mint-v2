import { z } from 'zod';

export const createProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required'),
	regions: z
		.array(z.string().min(1, 'Region name is required'))
		.min(1, 'At least one region is required')
		.refine((regions) => new Set(regions).size === regions.length, 'Regions must be unique')
});
