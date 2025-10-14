export const convertToLocaleString = (number: number) => number.toLocaleString('en-US', { maximumFractionDigits: 2 });

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
	return Array.from({ length: count }, (_, i) => min + i * step);
};
