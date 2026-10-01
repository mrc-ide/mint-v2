import { MOCK_FORM_SCHEMA } from '$mocks/mocks';
import { server } from '$mocks/server';
import * as urlModule from '$lib/url';
import { GET } from '$routes/csv-template/+server';
import { isHttpError, type HttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';

describe('csv-template +server.ts', () => {
	const mockUrl = 'http://localhost:8080/options';

	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(urlModule, 'regionFormUrl').mockReturnValue(mockUrl);
	});

	it('should return the template as a CSV download', async () => {
		server.use(http.get(mockUrl, () => HttpResponse.json({ data: MOCK_FORM_SCHEMA })));

		const response = await (GET({ fetch: fetch.bind(globalThis) } as any) as any);

		expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
		expect(response.headers.get('content-disposition')).toBe('attachment; filename="mint-project-template.csv"');
		const bytes = new Uint8Array(await response.arrayBuffer());
		expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
		expect(new TextDecoder().decode(bytes)).toContain('Region,Size of population');
	});

	it('should throw the error status when the form schema cannot be fetched', async () => {
		server.use(http.get(mockUrl, () => HttpResponse.json({ detail: 'nope' }, { status: 503 })));

		try {
			await (GET({ fetch: fetch.bind(globalThis) } as any) as any);
			expect.unreachable('GET should have thrown');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			expect((e as HttpError).status).toBe(503);
			expect((e as HttpError).body.message).toBe('Failed to build the project CSV template');
		}
	});
});
