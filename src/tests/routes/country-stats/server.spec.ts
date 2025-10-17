import { describe, it, expect, vi } from 'vitest';
import { GET } from '$routes/country-stats/+server';

import * as redis from '$lib/server/redis';

const mockCountryCounts = {
	US: 150,
	IN: 100,
	GB: 50
};
vi.spyOn(redis, 'getCountryCounts').mockResolvedValue(mockCountryCounts);

describe('/country-stats/+server.ts', () => {
	it('should return country stats', async () => {
		const response = await GET({} as any);
		const data = await response.json();

		expect(data).toEqual(mockCountryCounts);
	});
});
