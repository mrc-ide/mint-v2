import { isUrlSafeName } from '$lib/string';

describe('isUrlSafeName', () => {
	it.each(['Region 1', 'Région Nord', 'A.B', 'A+B', 'A&B', 'A-B (east)'])('should accept "%s"', (name) => {
		expect(isUrlSafeName(name)).toBe(true);
	});

	it.each(['A/B', 'A\\B', 'A?B', 'A#B', 'A%B'])('should reject "%s", which changes the page a URL requests', (name) => {
		expect(isUrlSafeName(name)).toBe(false);
	});
});
