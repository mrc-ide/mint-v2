type RoundMode = 'ceil' | 'floor' | 'round';

export const ROUNDING_METHODS = {
	ceil: Math.ceil,
	floor: Math.floor,
	round: Math.round
} as const;

export const roundNumber = (number: number, fractionalDigits = 2, roundMode: RoundMode = 'round'): number => {
	const multiplier = Math.pow(10, fractionalDigits);
	return ROUNDING_METHODS[roundMode](number * multiplier) / multiplier;
};

export const convertToLocaleString = (number: number, fractionalDigits = 2, roundMode: RoundMode = 'round') => {
	const rounded = roundNumber(number, fractionalDigits, roundMode);

	return rounded.toLocaleString('en-US', {
		minimumFractionDigits: fractionalDigits,
		maximumFractionDigits: fractionalDigits
	});
};

/**
 * Creates an array of linearly spaced values between a minimum and maximum value.
 *
 * @param min - The minimum value (start of the range)
 * @param max - The maximum value (end of the range)
 * @param count - Number of points to generate (default: 200)
 * @returns Array of linearly spaced values from min to max
 */
export const createLinearSpace = (min: number, max: number, count = 200): number[] => {
	if (count <= 1) return [min];
	const step = (max - min) / (count - 1);

	const result = Array.from({ length: count }, (_, i) => min + i * step);
	result[count - 1] = max; // Ensure the last value is exactly max

	return result;
};

type NumericKeyOf<T> = {
	[Key in keyof T]: T[Key] extends number ? Key : never;
}[keyof T];
/**
 * Sums the values of a specified numeric key across an array of objects.
 *
 * @template T - The type of objects in the array
 * @template K - The key of the numeric property to sum
 * @param items - The array of objects to sum over
 * @param key - The key of the numeric property to sum
 * @returns The total sum of the specified numeric key across all objects in the array
 */
export function sumByKey<T extends Record<string, unknown>, K extends NumericKeyOf<T>>(items: T[], key: K): number {
	return items.reduce((total, item) => total + (item[key] as number), 0);
}
