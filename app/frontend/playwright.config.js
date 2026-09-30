import { defineConfig, devices } from '@playwright/test'

// Runs the whole UI in demo mode (no backend needed) against the system's Chrome.
// In CI set PLAYWRIGHT_CHANNEL=chromium after `npx playwright install chromium`.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:5199', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' } }],
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    env: { VITE_DEMO_MODE: 'true' },
    url: 'http://localhost:5199',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
