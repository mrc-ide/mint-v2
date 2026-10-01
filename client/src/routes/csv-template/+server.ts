import { buildProjectCsvTemplate, PROJECT_CSV_TEMPLATE_FILENAME } from '$lib/server/projectCsvTemplate';
import { getFormSchema } from '$lib/server/region';
import { BYTE_ORDER_MARK } from '$lib/csv';
import { ApiError } from '$lib/fetch';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handle GET requests for the CSV template users fill in to create a project.
 *
 * The template is generated from the region form schema so that its columns always match the form.
 *
 * @returns A CSV file download with a column per form field and example regions.
 */
export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const formSchema = await getFormSchema(fetch);
		// the byte order mark tells Excel the file is UTF-8, so names with accents survive being edited
		return new Response(BYTE_ORDER_MARK + buildProjectCsvTemplate(formSchema), {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${PROJECT_CSV_TEMPLATE_FILENAME}"`
			}
		});
	} catch (e) {
		const status = e instanceof ApiError ? e.status : 500;
		error(status, 'Failed to build the project CSV template');
	}
};
