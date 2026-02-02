import { server } from '$mocks/server';
import { load } from '$routes/+layout.server';
import { isHttpError, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';

const mockUrl = vi.hoisted(() => 'http://localhost:8080/emulator/run');
vi.mock('$lib/url', () => ({
	versionEndpoint: vi.fn(() => mockUrl)
}));
describe('root +layout.server.ts', () => {
	describe('load function', () => {
		it('should return user data from locals & version info from server', async () => {
			const mockLocals = {
				userState: {
					userId: 'test-user-id',
					createdAt: '2024-01-01T00:00:00.000Z',
					projects: []
				}
			};
			server.use(http.get(mockUrl, () => HttpResponse.json({ data: { server: '1.0.0', minte: '2.0.0' } })));

			const data = (await load({ locals: mockLocals } as any)) as any;

			expect(data.userData).toEqual(mockLocals.userState);
			expect(data.versionInfo).toEqual({ server: '1.0.0', minte: '2.0.0' });
		});

		it('should throw error if version info fetch fails', async () => {
			server.use(http.get(mockUrl, () => HttpResponse.error()));

			try {
				await load({ locals: {} } as any);
			} catch (e) {
				expect(isHttpError(e)).toBe(true);
				expect((e as HttpError).status).toBe(500);
				expect((e as HttpError).body.message).toBe('Failed to fetch version info from server');
			}
		});
	});
});
