import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/** Run only tests under tests/manual/ (not part of default `npx playwright test`). */
export default defineConfig({
  testDir: './tests/manual',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
