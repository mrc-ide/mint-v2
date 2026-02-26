import { worker } from './src/tests/mocks/worker';
import { it } from 'vitest';

/**
 * Use this for vitest browser mode when you need to mock network requests.
 */
interface TestWithWorker {
	worker: typeof worker;
}

export const testWithWorker = it.extend<TestWithWorker>({
	worker: [
		async ({ _local }, use) => {
			// Start the worker before the test.
			await worker.start({ quiet: true });

			// Expose the worker object on the test's context.
			await use(worker);

			// Remove any request handlers added in individual test cases.
			// This prevents them from affecting unrelated tests.
			worker.resetHandlers();

			// Stop the worker after the test.
			worker.stop();
		},
		{
			auto: true // affect the tests that don’t reference the worker fixture explicitly.
		}
	]
});
