import { describe, it, expect } from 'vitest';
import { load } from '$routes/+page.server';

describe('root +page.server.ts', () => {
	it('should load data', async () => {
		const data = await load({} as any);
		expect(data?.name).toEqual('Mint');
	});
});
