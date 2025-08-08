import { z } from 'zod';
export const addRegionSchema = z.object({
	name: z.string().min(1, 'Region name is required')
});
