import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const userGuideLanguage = url.searchParams.get('lang') || 'en';

	return {
		userGuideLanguage
	};
};
