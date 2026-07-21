import { defineConfig, devices } from '@playwright/test'

// Frontend-only harness for the architecture explorer. The page is public and rendered entirely
// from bundled sources, so unlike the full suite (e2e/run.sh) it needs neither the backend, the
// database, nor the identity stack — it boots one Vite dev server and nothing else.
export default defineConfig({
  testDir: './e2e',
  testMatch: /architecture\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:15173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 15173',
    url: 'http://localhost:15173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
