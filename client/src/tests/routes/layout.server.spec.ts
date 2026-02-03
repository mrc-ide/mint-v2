import { load } from '$routes/+layout.server';

const mockUrl = vi.hoisted(() => 'http://localhost:8080/version');
vi.mock('$lib/url', () => ({
	versionUrl: vi.fn(() => mockUrl)
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

			const data = (await load({ locals: mockLocals } as any)) as any;

			expect(data.userData).toEqual(mockLocals.userState);
		});
	});
});
