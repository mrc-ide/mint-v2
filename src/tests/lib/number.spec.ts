import { convertToLocaleString, createLinearSpace, ROUNDING_METHODS } from '$lib/number';

describe('convertToLocaleString', () => {
	it('should format number with default 2 decimal places', () => {
		expect(convertToLocaleString(1234.5678)).toBe('1,234.57');
	});

	it('should format number with custom decimal places', () => {
		expect(convertToLocaleString(1234.5678, 3)).toBe('1,234.568');
		expect(convertToLocaleString(1234.5678, 0)).toBe('1,235');
		expect(convertToLocaleString(1234.5678, 1)).toBe('1,234.6');
	});

	it('should round using default round mode', () => {
		expect(convertToLocaleString(1.235, 2)).toBe('1.24');
		expect(convertToLocaleString(1.234, 2)).toBe('1.23');
	});

	it('should round up when using ceil mode', () => {
		expect(convertToLocaleString(1.231, 2, 'ceil')).toBe('1.24');
		expect(convertToLocaleString(1.239, 2, 'ceil')).toBe('1.24');
	});

	it('should round down when using floor mode', () => {
		expect(convertToLocaleString(1.239, 2, 'floor')).toBe('1.23');
		expect(convertToLocaleString(1.231, 2, 'floor')).toBe('1.23');
	});

	it('should handle negative numbers', () => {
		expect(convertToLocaleString(-1234.5678, 2)).toBe('-1,234.57');
		expect(convertToLocaleString(-1.235, 2, 'ceil')).toBe('-1.23');
		expect(convertToLocaleString(-1.235, 2, 'floor')).toBe('-1.24');
	});

	it('should handle zero', () => {
		expect(convertToLocaleString(0, 2)).toBe('0.00');
		expect(convertToLocaleString(0, 0)).toBe('0');
	});

	it('should handle very large numbers', () => {
		expect(convertToLocaleString(1234567890.12, 2)).toBe('1,234,567,890.12');
	});

	it('should handle very small numbers', () => {
		expect(convertToLocaleString(0.00123, 5)).toBe('0.00123');
		expect(convertToLocaleString(0.001234, 3)).toBe('0.001');
	});
});

describe('createLinearSpace', () => {
	it('should create array with default 200 points', () => {
		const result = createLinearSpace(0, 100);
		expect(result).toHaveLength(200);
		expect(result[0]).toBe(0);
		expect(result[199]).toBe(100);
	});

	it('should create array with custom point count', () => {
		const result = createLinearSpace(0, 10, 5);
		expect(result).toHaveLength(5);
		expect(result).toEqual([0, 2.5, 5, 7.5, 10]);
	});

	it('should handle single point', () => {
		const result = createLinearSpace(5, 10, 1);
		expect(result).toEqual([5]);
	});

	it('should handle zero or negative count', () => {
		const result = createLinearSpace(0, 10, 0);
		expect(result).toEqual([0]);
	});

	it('should create evenly spaced values', () => {
		const result = createLinearSpace(0, 1, 11);
		expect(result).toHaveLength(11);
		expect(result[0]).toBe(0);
		expect(result[5]).toBeCloseTo(0.5);
		expect(result[10]).toBe(1);
	});

	it('should handle negative ranges', () => {
		const result = createLinearSpace(-10, -5, 6);
		expect(result).toHaveLength(6);
		expect(result[0]).toBe(-10);
		expect(result[5]).toBe(-5);
	});

	it('should handle reverse ranges', () => {
		const result = createLinearSpace(10, 0, 3);
		expect(result).toEqual([10, 5, 0]);
	});

	it('should produce consistent spacing', () => {
		const result = createLinearSpace(0, 100, 11);
		const differences = result.slice(1).map((val, i) => val - result[i]);
		const firstDiff = differences[0];
		differences.forEach((diff) => {
			expect(diff).toBeCloseTo(firstDiff);
		});
	});
});

describe('ROUNDING_METHODS', () => {
	it('should contain expected rounding methods', () => {
		expect(ROUNDING_METHODS.ceil).toBe(Math.ceil);
		expect(ROUNDING_METHODS.floor).toBe(Math.floor);
		expect(ROUNDING_METHODS.round).toBe(Math.round);
	});
});
