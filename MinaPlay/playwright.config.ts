import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true
  },
  webServer: {
    command: 'npm run build && node dist/server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
