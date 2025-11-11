import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		/**
		 * Use the dev server by default for faster feedback loop.
		 * Use the preview server on CI for more realistic testing.
		 * Playwright will re-use the local server if there is already a dev-server running.
		 */
		command: process.env.CI ? 'npm run build && npm run preview -- --port 5173' : 'npm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'list'
});
