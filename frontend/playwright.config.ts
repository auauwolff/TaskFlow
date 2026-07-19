import { defineConfig, devices } from '@playwright/test'

const authenticatedState = 'test-results/.auth/user.json'

export default defineConfig({
  testDir: './e2e',
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
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authenticatedState,
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: [
    {
      command:
        'dotnet run --project ../backend/src/TaskFlow.Api/TaskFlow.Api.csproj --no-launch-profile',
      url: 'http://localhost:15131/api/auth/me',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: 'http://localhost:15131',
        ConnectionStrings__TaskFlow:
          'Host=localhost;Port=55432;Database=taskflow_e2e;Username=taskflow_e2e;Password=taskflow_e2e_pwd',
        Authentication__Oidc__Authority: 'http://localhost:18080/realms/taskflow',
        Authentication__Oidc__PublicOrigin: 'http://localhost:15173',
      },
    },
    {
      command: 'pnpm dev --host 127.0.0.1 --port 15173',
      url: 'http://localhost:15173',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_PROXY_TARGET: 'http://localhost:15131',
      },
    },
  ],
})
