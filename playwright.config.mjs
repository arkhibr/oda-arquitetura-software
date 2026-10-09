import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:8799' },
  webServer: { command: 'python3 scripts/servidor_estatico.py 8799 site', url: 'http://127.0.0.1:8799/oda-20/', reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
