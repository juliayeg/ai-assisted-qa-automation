import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import {
  openEditProgramModal,
  saveEditProgram,
  seedProgramForEdit,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';
import { ProgramsPage } from '../pages/ProgramsPage';

test.describe('DS-257 — Edit existing program details', () => {
  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('Open program for editing shows pre-populated edit form', async ({ page }, testInfo) => {
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
  });

  test('Description-only edit preserves Program Name and other fields', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const originalDescription = `Original description ${suffix}`;
    const updatedDescription = `Updated description ${suffix}`;

    await seedProgramForEdit(programs, programName, originalDescription);

    const firstEdit = await openEditProgramModal(programs, programName);
    await expect(firstEdit.programName).toHaveValue(programName);
    await expect(firstEdit.defaultSessionHours).toHaveValue('4');
    await expect(firstEdit.defaultExamHours).toHaveValue('3');
    await firstEdit.description.fill(updatedDescription);
    await saveEditProgram(firstEdit);

    const reopened = await openEditProgramModal(programs, programName);
    await expect(reopened.programName).toHaveValue(programName);
    await expect(reopened.description).toHaveValue(updatedDescription);
    await expect(reopened.defaultSessionHours).toHaveValue('4');
    await expect(reopened.defaultExamHours).toHaveValue('3');
  });

  test('Cancel edit does not change the program', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const description = `Original ${suffix}`;
    const attemptedName = `${programName} - Updated`;

    await seedProgramForEdit(programs, programName, description);

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill(attemptedName);
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programs.editProgramButton(programName)).toBeVisible();
    await expect(programs.editProgramButton(attemptedName)).toHaveCount(0);
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

  test(
    'PATCH save returns 503 — error state and original name remain in list',
    { tag: '@programs-503-patch' },
    async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      const programs = new ProgramsPage(page);
      const suffix = uniqueSuffix(testInfo.testId);
      const programName = `Web Development 2026 ${suffix}`;
      const attemptedName = `${programName} - Updated`;

      await page.route('**/api/programs/**', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Service Unavailable' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await seedProgramForEdit(programs, programName, `503 patch guard ${suffix}`);

        const modal = await openEditProgramModal(programs, programName);
        await modal.programName.fill(attemptedName);
        await modal.clickSave();

        await expect(modal.dialog).toBeVisible();
        const saveFailureUi = modal
          .dialogAlert()
          .or(modal.saveError())
          .or(programs.errorAlerts);
        await expect(saveFailureUi).toBeVisible({ timeout: 15_000 });

        await expect(programs.editProgramButton(programName)).toBeVisible();
        await expect(programs.editProgramButton(attemptedName)).toHaveCount(0);
      } finally {
        await page.unrouteAll();
      }
    },
  );

  test('Edited name with special characters is saved', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const originalName = `Web Development 2026 ${suffix}`;
    const updatedName = `Web Development 2026 - Updated & Revised ${suffix}`;

    await seedProgramForEdit(programs, originalName, `Special chars seed ${suffix}`);

    const modal = await openEditProgramModal(programs, originalName);
    await modal.programName.fill(updatedName);
    await saveEditProgram(modal);

    await expect(programs.editProgramButton(updatedName)).toBeVisible({ timeout: 30_000 });
    await expect(programs.editProgramButton(originalName)).toHaveCount(0);
  });
});
