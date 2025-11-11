type RoundMode = 'ceil' | 'floor' | 'round';

export const ROUNDING_METHODS = {
	ceil: Math.ceil,
	floor: Math.floor,
	round: Math.round
} as const;

export const convertToLocaleString = (number: number, fractionalDigits = 2, roundMode: RoundMode = 'round') => {
	const multiplier = Math.pow(10, fractionalDigits);
	const rounded = ROUNDING_METHODS[roundMode](number * multiplier) / multiplier;

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
