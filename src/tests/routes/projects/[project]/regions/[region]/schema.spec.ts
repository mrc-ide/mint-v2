import { addRegionSchema, regionNameSchema } from '$routes/projects/[project]/regions/[region]/schema';

describe('regionNameSchema', () => {
	it('should validate valid region name', () => {
		const result = regionNameSchema.safeParse('Region 1');
		expect(result.success).toBe(true);
	});
	it('should reject empty region name', () => {
		const result = regionNameSchema.safeParse('');
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Region name is required');
		}
	});
});

describe('addRegionSchema', () => {
	it('should validate valid region data', () => {
		const validData = {
			name: 'New Region'
		};

		const result = addRegionSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('should reject invalid region data', () => {
		const invalidData = {
			name: ''
		};

		const result = addRegionSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe('Region name is required');
		}
	});
});
