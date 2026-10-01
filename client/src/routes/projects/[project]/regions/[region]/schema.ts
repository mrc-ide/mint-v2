import { isUrlSafeName, URL_RESERVED_CHARACTERS_MESSAGE } from '$lib/string';
import { z } from 'zod';

export const regionNameSchema = z
	.string()
	.min(1, 'Region name is required')
	.refine(isUrlSafeName, `Region names ${URL_RESERVED_CHARACTERS_MESSAGE}`);

export const addRegionSchema = z.object({
	name: regionNameSchema
});
