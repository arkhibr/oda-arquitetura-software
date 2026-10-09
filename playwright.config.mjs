import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:8799' },
  webServer: { command: 'python3 -m http.server 8799 --bind 127.0.0.1 -d site', url: 'http://127.0.0.1:8799/novo/oda-20/', reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
