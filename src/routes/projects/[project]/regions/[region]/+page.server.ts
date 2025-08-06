import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { project, region } = params;
	return {
		project,
		region
	};
};
