import { z } from 'zod';
export const regionNameSchema = z.string().min(1, 'Region name is required');
export const addRegionSchema = z.object({
	name: regionNameSchema
});
