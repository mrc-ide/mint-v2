import { convertToLocaleString, createLinearSpace, ROUNDING_METHODS, roundNumber } from '$lib/number';

describe('roundNumber', () => {
	it('should round number with default 2 decimal places', () => {
		expect(roundNumber(1.2345)).toBe(1.23);
	});

	it('should round number with custom decimal places', () => {
		expect(roundNumber(1.23456, 3)).toBe(1.235);
		expect(roundNumber(1.23456, 4)).toBe(1.2346);
	});

	it('should use default round mode', () => {
		expect(roundNumber(1.235, 2)).toBe(1.24);
	});

	it('should round up when using ceil mode', () => {
		expect(roundNumber(1.231, 2, 'ceil')).toBe(1.24);
		expect(roundNumber(1.1, 0, 'ceil')).toBe(2);
	});

	it('should round down when using floor mode', () => {
		expect(roundNumber(1.239, 2, 'floor')).toBe(1.23);
		expect(roundNumber(1.9, 0, 'floor')).toBe(1);
	});

	it('should handle negative numbers', () => {
		expect(roundNumber(-1.235, 2)).toBe(-1.24);
		expect(roundNumber(-1.235, 2, 'floor')).toBe(-1.24);
	});

	it('should handle zero', () => {
		expect(roundNumber(0, 2)).toBe(0);
	});

	it('should handle very large numbers', () => {
		expect(roundNumber(123456789.123, 2)).toBe(123456789.12);
		expect(roundNumber(123456789.127, 2)).toBe(123456789.13);
	});

	it('should handle very small numbers', () => {
		expect(roundNumber(0.001234, 3)).toBe(0.001);
		expect(roundNumber(0.001234, 5)).toBe(0.00123);
		expect(roundNumber(0.0019, 2)).toBe(0);
	});

	it('should handle whole numbers', () => {
		expect(roundNumber(42, 3)).toBe(42);
	});

	it('should handle edge cases with precision', () => {
		expect(roundNumber(1.555, 2)).toBe(1.56);
	});
});

describe('convertToLocaleString', () => {
	it('should format number with default 2 decimal places', () => {
		expect(convertToLocaleString(1234.5678)).toBe('1,234.57');
	});

	it('should format number with custom decimal places', () => {
		expect(convertToLocaleString(1234.5678, 3)).toBe('1,234.568');
	});

	it('should round using default round mode', () => {
		expect(convertToLocaleString(1.235, 2)).toBe('1.24');
	});

	it('should round up when using ceil mode', () => {
		expect(convertToLocaleString(1.231, 2, 'ceil')).toBe('1.24');
	});

	it('should round down when using floor mode', () => {
		expect(convertToLocaleString(1.231, 2, 'floor')).toBe('1.23');
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
