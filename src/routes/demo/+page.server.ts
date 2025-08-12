import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Fake timeseries refetch: return a timestamp so invalidateAll shows it changed.
	return {
		ts: Date.now()
	};
};
