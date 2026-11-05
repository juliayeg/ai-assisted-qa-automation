import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { expectNoAxeViolations, runA11yCheck } from '../fixtures/a11y-expect';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectNewProgramModalOpen,
  gotoProgramsAndReady,
  openEditProgramModal,
  saveEditProgram,
  seedProgramForEdit,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-257 — Edit existing program details (Valeria)', () => {
  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('Open program for editing shows form pre-populated with current data', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const description = `Full-stack web development program ${suffix}`;

    await seedProgramForEdit(programs, programName, description);
    const modal = await openEditProgramModal(programs, programName);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programName).toHaveValue(programName);
    await expect(modal.description).toHaveValue(description);
    await expect(modal.saveButton).toBeEnabled();
    await expect(modal.cancelButton).toBeVisible();
    await expect(modal.createButton()).toHaveCount(0);
  });

  test('Successfully edit a program name updates the list immediately', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const originalName = `Web Development 2026 ${suffix}`;
    const updatedName = `${originalName} - Updated`;
    const description = `Curriculum ${suffix}`;

    await seedProgramForEdit(programs, originalName, description);

    const modal = await openEditProgramModal(programs, originalName);
    await modal.programName.fill(updatedName);
    await saveEditProgram(modal);

    await expect(programs.editProgramButton(updatedName)).toBeVisible({ timeout: 30_000 });
    await expect(programs.editProgramButton(originalName)).toHaveCount(0);
    await expect(programs.programNameText(updatedName)).toBeVisible();
  });

  test('Edit preserves unchanged fields when only description changes', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const originalDescription = `Original description ${suffix}`;
    const updatedDescription = `Updated description ${suffix}`;

    await seedProgramForEdit(programs, programName, originalDescription);

    const modal = await openEditProgramModal(programs, programName);
    await modal.description.fill(updatedDescription);
    await saveEditProgram(modal);

    await expect(programs.editProgramButton(programName)).toBeVisible();
    await expect(programs.programNameText(programName)).toBeVisible();

    const reopened = await openEditProgramModal(programs, programName);
    await expect(reopened.programName).toHaveValue(programName);
    await expect(reopened.description).toHaveValue(updatedDescription);
  });

  test('Empty Program Name is not saved', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await seedProgramForEdit(programs, programName, `Keep name required ${suffix}`);

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill('');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programs.editProgramButton(programName)).toBeVisible();
  });

  test('Saving a duplicate name is rejected', async ({ page }, testInfo) => {
    test.fail(true, 'Known defect: edit accepts a name that already exists (DS-13 / DS-122)');
    test.setTimeout(180_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const firstName = `Web Development 2026 ${suffix}`;
    const secondName = `Web Development 2026 - Updated ${suffix}`;

    await seedProgramForEdit(programs, firstName, `First ${suffix}`);
    await seedProgramForEdit(programs, secondName, `Second ${suffix}`);

    const modal = await openEditProgramModal(programs, firstName);
    await modal.programName.fill(secondName);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.duplicateError()).toBeVisible();
    await expect(programs.editProgramButton(firstName)).toHaveCount(1);
    await expect(programs.editProgramButton(secondName)).toHaveCount(1);
  });

  test(
    'Programs update API 503 on save shows error and list is unchanged',
    { tag: '@programs-503-patch' },
    async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      const programs = new ProgramsPage(page);
      const suffix = uniqueSuffix(testInfo.testId);
      const originalName = `Web Development 2026 ${suffix}`;
      const updatedName = `${originalName} - Updated`;

      await seedProgramForEdit(programs, originalName, `Program ${suffix}`);

      await page.route('**/api/programs**', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service unavailable' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const modal = await openEditProgramModal(programs, originalName);
        await modal.programName.fill(updatedName);
        await modal.clickSave();

        await expect(async () => {
          const alertVisible = await programs.errorAlerts.isVisible();
          const modalStillOpen = await modal.dialog.isVisible();
          expect(alertVisible || modalStillOpen).toBe(true);
        }).toPass({ timeout: 15_000 });

        await expect(programs.editProgramButton(originalName)).toBeVisible();
        await expect(programs.editProgramButton(updatedName)).toHaveCount(0);
      } finally {
        await page.unrouteAll();
      }
    },
  );

  test(
    'Programs page meets WCAG 2 A and AA via axe',
    { tag: '@ds257-a11y-axe' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await gotoProgramsAndReady(programs);
      await expectNoAxeViolations(page);
    },
  );

  test(
    'Keyboard opens New Program dialog from Programs page',
    { tag: '@ds257-a11y-keyboard' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await gotoProgramsAndReady(programs);

      await runA11yCheck('ds257-keyboard-new-program-dialog', async () => {
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
});
