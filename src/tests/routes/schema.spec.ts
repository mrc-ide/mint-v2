import { createProjectSchema } from '$routes/schema';

describe('create project schema', () => {
	it('should validate a correct project', () => {
		const result = createProjectSchema.safeParse({
			name: 'My Project',
			regions: ['us-east-1', 'eu-west-1']
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				name: 'My Project',
				regions: ['us-east-1', 'eu-west-1']
			});
		}
	});

	it('should reject an empty name', () => {
		const res = createProjectSchema.safeParse({
			name: '',
			regions: ['us-east-1']
		});
		expect(res.success).toBe(false);
		if (!res.success) {
			const errors = res.error.flatten();
			expect(errors.fieldErrors.name?.[0]).toBe('Project name is required');
		}
	});

	it('should reject when regions is empty', () => {
		const res = createProjectSchema.safeParse({
			name: 'My Project',
			regions: []
		});
		expect(res.success).toBe(false);
		if (!res.success) {
			const errors = res.error.flatten();
			expect(errors.fieldErrors.regions?.[0]).toBe('At least one region is required');
		}
	});

	it('should reject when regions are not unique', () => {
		const res = createProjectSchema.safeParse({
			name: 'My Project',
			regions: ['us-east-1', 'us-east-1']
		});
		expect(res.success).toBe(false);
		if (!res.success) {
			const errors = res.error.flatten();
			expect(errors.fieldErrors.regions?.[0]).toBe('Regions must be unique');
		}
	});

	it('should report multiple errors together', () => {
		const res = createProjectSchema.safeParse({
			name: '',
			regions: ['dup', 'dup']
		});
		expect(res.success).toBe(false);
		if (!res.success) {
			const errors = res.error.flatten();
			expect(errors.fieldErrors.name?.[0]).toBe('Project name is required');
			expect(errors.fieldErrors.regions?.[0]).toBe('Regions must be unique');
		}
	});

	it('should strip unknown keys', () => {
		const res = createProjectSchema.safeParse({
			name: 'Project',
			regions: ['us-east-1'],
			unknown: 'value'
		} as unknown as Record<string, unknown>);
		expect(res.success).toBe(true);
		if (res.success) {
			expect((res.data as Record<string, unknown>).unknown).toBeUndefined();
			expect(res.data).toEqual({ name: 'Project', regions: ['us-east-1'] });
		}
	});
});
