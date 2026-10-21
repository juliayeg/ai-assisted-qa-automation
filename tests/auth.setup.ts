import fs from 'fs';
import path from 'path';

import { test as setup } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  setup.setTimeout(60_000);

  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  }

  await new LoginPage(page).signIn(email, password);
  await new ProgramsPage(page).goto();
  await page.waitForURL('**/programs');

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
