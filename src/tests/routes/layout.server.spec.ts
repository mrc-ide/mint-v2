import { describe, it, expect } from 'vitest';
import { load } from '$routes/+layout.server';

describe('root +layout.server.ts', () => {
	describe('load function', () => {
		it('should return user data from locals', async () => {
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
