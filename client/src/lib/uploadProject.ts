import { apiFetch } from './fetch';
import type { Project } from './types/userState';
import { regionUrl } from './url';

/**
 * Run the emulator for every region of a project created from a CSV, one region at a time.
 *
 * Each run saves the whole user state, so running them in parallel would lose all but the last result.
 *
 *
 * @param project The project to run the emulator for.
 * @param onRegionRun A callback that is called after each region run, with the number of regions that have been run so far.
 * @returns The names of the regions whose run failed.
 */
export const runUploadedProjectRegions = async (
	{ name, regions }: Project,
	onRegionRun: (regionsRun: number) => void
): Promise<string[]> => {
	const failedRegions: string[] = [];

	for (const [index, region] of regions.entries()) {
		try {
			await apiFetch({
				url: regionUrl(name, region.name),
				method: 'POST',
				body: { formValues: region.formValues }
			});
		} catch (_e) {
			failedRegions.push(region.name);
		}
		onRegionRun(index + 1);
	}

	return failedRegions;
};
