import { z } from 'zod';
import { regionNameSchema } from './projects/[project]/regions/[region]/schema';

export const createProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required'),
	regions: z
		.array(regionNameSchema)
		.min(1, 'At least one region is required')
		.refine((regions) => new Set(regions).size === regions.length, 'Regions must be unique')
});
