import { z } from 'zod';
import { regionNameSchema } from './projects/[project]/regions/[region]/schema';
import { isUrlSafeName, URL_RESERVED_CHARACTERS_MESSAGE } from '$lib/string';

const INVALID_PROJECT_NAME_MESSAGE = `Project names ${URL_RESERVED_CHARACTERS_MESSAGE}`;
export const createProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required').refine(isUrlSafeName, INVALID_PROJECT_NAME_MESSAGE),
	regions: z
		.array(regionNameSchema)
		.min(1, 'At least one region is required')
		.refine((regions) => new Set(regions).size === regions.length, 'Regions must be unique')
});

export const MAX_CSV_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const uploadProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required').refine(isUrlSafeName, INVALID_PROJECT_NAME_MESSAGE),
	file: z
		.instanceof(File, { message: 'A CSV file is required' })
		.refine((file) => file.size > 0, 'A CSV file is required')
		.refine((file) => file.size <= MAX_CSV_FILE_SIZE_BYTES, 'The CSV file must be smaller than 2MB')
});
