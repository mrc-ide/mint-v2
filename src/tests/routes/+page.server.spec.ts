import { describe, it, expect } from 'vitest';
import { load } from '$routes/+page.server';

describe('root +page.server.ts', () => {
	it('should load data', async () => {
		const data = await (load({ url: new URL('http://localhost:3000') } as any) as any);

		expect(data.userGuideLanguage).toBe('en');
		expect(data.form).toBeDefined();
	});
});
