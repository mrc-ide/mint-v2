import { GET } from '$routes/healthz/+server';

describe('/healthz/+server.ts', () => {
	it('should return status ok', async () => {
		const response = await GET({} as any);
		const data = await response.json();
		expect(data).toEqual({ status: 'ok' });
	});
});
