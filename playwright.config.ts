import { defineConfig, devices } from '@playwright/test'

// Los tests corren contra los EMULADORES de Firebase (nunca contra producción).
// Se lanzan con: npm run test:e2e  (levanta los emuladores y luego Playwright).
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:5421', trace: 'retain-on-failure' },
  projects: [{ name: 'movil', use: { ...devices['Pixel 7'] } }, { name: 'escritorio', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev:emulador', url: 'http://localhost:5421', reuseExistingServer: !process.env.CI, timeout: 60000 },
})
