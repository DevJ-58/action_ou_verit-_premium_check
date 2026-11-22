import { defineConfig, devices } from '@playwright/test'

const BASE = 'http://localhost:4173/action_ou_verit-_premium_check/'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE,
    trace: 'off',
    reducedMotion: 'reduce',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        reducedMotion: 'reduce',
        // Some sandboxes ship a preinstalled Chromium instead of Playwright's download.
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    // End-to-end tests run on the local backends (two tabs = two phones), never on the real server.
    command: 'VITE_BACKEND=local npm run build && npx vite preview --port 4173 --strictPort',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
