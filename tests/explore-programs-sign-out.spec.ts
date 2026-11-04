import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { gotoProgramsAndReady } from '../fixtures/programs-page-expect';

test.describe('Explore — Programs sign out', () => {
  test(
    'Sign out from Programs returns to login',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const login = new LoginPage(page);

      await gotoProgramsAndReady(programs);
      await programs.signOut();

      await expect(page).toHaveURL(/\/login/);
      await expect(login.signInButton).toBeVisible();
      await expect(login.email).toBeVisible();
    },
  );

  test(
    'Signed-out user cannot open Programs via URL',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const login = new LoginPage(page);

      await gotoProgramsAndReady(programs);
      await programs.signOut();
      await expect(page).toHaveURL(/\/login/);

      await programs.goto();
      await expect(page).toHaveURL(/\/login/);
      await expect(login.email).toBeVisible();
    },
  );
});
