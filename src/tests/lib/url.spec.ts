import { regionFormUrl, regionUrl, runEmulatorUrl } from '$lib/url';

const mockUrl = vi.hoisted(() => 'http://mock-mintr-url.com');
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_MINTR_URL: mockUrl
	}
}));

describe('urls', () => {
	it('should generate correct region URL', () => {
		const projectName = 'malaria-project';
		const regionName = 'region-1';
		const expectedUrl = `/projects/${projectName}/regions/${regionName}`;
		expect(regionUrl(projectName, regionName)).toBe(expectedUrl);
	});

	it('should generate correct region form URL', () => {
		const expectedUrl = mockUrl + '/options';
		expect(regionFormUrl()).toBe(expectedUrl);
	});

	it('should generate correct run emulator URL', () => {
		const expectedUrl = mockUrl + '/emulator/run';
		expect(runEmulatorUrl()).toBe(expectedUrl);
	});
});
