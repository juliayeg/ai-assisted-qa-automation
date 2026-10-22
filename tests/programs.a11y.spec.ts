import { test, expect } from '@playwright/test';

import { expectNoAxeViolations, runA11yCheck } from '../fixtures/a11y-expect';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectNewProgramModalOpen,
  gotoFreshProgramsPage,
} from '../fixtures/programs-page-expect';

test.describe('Programs page accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFreshProgramsPage(new ProgramsPage(page));
  });

  test(
    'Programs page meets WCAG 2 A/AA (axe)',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await expectNoAxeViolations(page);
    },
  );

  test(
    'Keyboard opens New Program dialog from primary control',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await runA11yCheck('keyboard-new-program-dialog', async () => {
        await programs.tabUntilNewProgramButtonFocused();
        await expect(programs.newProgramButton).toBeFocused();
        await programs.pressEnter();

        await expect(modal.dialog).toBeVisible();
        await expectNewProgramModalOpen(modal);

        await modal.clickCancel();
        await expect(modal.dialog).toBeHidden();
      });
    },
  );

  test(
    'New Program modal meets WCAG 2 A/AA when scoped with .include',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgramForm();
      await expectNewProgramModalOpen(modal);

      const includeScope = await modal.axeIncludeSelector();

      await expectNoAxeViolations(page, (builder) => builder.include(includeScope));

      await modal.clickCancel();
      await expect(modal.dialog).toBeHidden();
    },
  );
});
