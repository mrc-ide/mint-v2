import { server } from '$mocks/server';
import { load } from '$routes/version/+page.server';
import { http, HttpResponse } from 'msw';

const mockUrl = vi.hoisted(() => 'http://localhost:8080/version');
vi.mock('$lib/url', () => ({
	versionUrl: vi.fn(() => mockUrl)
}));

describe('load function', () => {
	it('should return version info from server', async () => {
		server.use(http.get(mockUrl, () => HttpResponse.json({ data: { server: '1.0.0', minte: '2.0.0' } })));

		const data = (await load({} as any)) as any;

		expect(data.versionInfo).toEqual({ server: '1.0.0', minte: '2.0.0' });
	});
	it('should throw error if version info fetch fails', async () => {
		server.use(http.get(mockUrl, () => HttpResponse.error()));

		await expect(load({ locals: {} } as any)).rejects.toMatchObject({
			status: 500,
			body: {
				message: 'Failed to fetch version info from server'
			}
		});
	});
});
