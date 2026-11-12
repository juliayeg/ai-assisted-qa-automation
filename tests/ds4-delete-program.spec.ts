import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { seedProgramForDelete } from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-4 — Delete program with confirmation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test(
    'Delete program with confirmation',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);
      await expect(programs.programRow(programName)).toHaveCount(1);

      const dialog = await programs.clickDeleteWithDialog(programName, true);
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/Delete program/i);
      expect(dialog.message()).toMatch(/cannot be undone/i);
      await expect(programs.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Confirmation dialog names the program being deleted',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Cybersecurity Basics ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);

      const dialog = await programs.clickDeleteWithDialog(programName, false);
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/Delete program/i);
      expect(dialog.message()).toContain(programName);
      await expect(programs.programRow(programName)).toHaveCount(1);
    },
  );

  test(
    'Cancel program deletion',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);

      const dialog = await programs.clickDeleteWithDialog(programName, false);
      expect(dialog.type()).toBe('confirm');
      await expect(programs.programRow(programName)).toHaveCount(1);
    },
  );

  test(
    'Opening the confirmation dialog does not delete the program',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);

      // Dismiss inside the dialog listener so native confirm does not deadlock click().
      const dialog = await programs.clickDeleteWithDialog(programName, false);
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/Delete program/i);
      await expect(programs.programRow(programName)).toHaveCount(1);
    },
  );

  test(
    'Deleting one program leaves a different program in the list',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      const programs = new ProgramsPage(page);
      const suffix = uniqueSuffix(testInfo.testId);
      const toDelete = `Test Program ${suffix}`;
      const toKeep = `Web Development 2026 ${suffix}`;

      await seedProgramForDelete(programs, toDelete, `Seed ${toDelete}`);
      await seedProgramForDelete(programs, toKeep, `Seed ${toKeep}`);

      await programs.clickDeleteWithDialog(toDelete, true);
      await expect(programs.programRow(toDelete)).toHaveCount(0);
      await expect(programs.programRow(toKeep)).toHaveCount(1);
    },
  );

  test(
    'Confirming deletion once removes the program only once',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);
      await expect(programs.programRow(programName)).toHaveCount(1);

      await programs.clickDeleteWithDialog(programName, true);
      await expect(programs.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Delete a program whose name contains special characters',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix(testInfo.testId)}`;

      await seedProgramForDelete(programs, programName, `Seed ${programName}`);
      await programs.clickDeleteWithDialog(programName, true);
      await expect(programs.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Failed server delete preserves the program in the list',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

      await page.route('**/api/programs/*', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Service unavailable' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await seedProgramForDelete(programs, programName, `Seed ${programName}`);
        await programs.clickDeleteWithDialog(programName, true);
        await expect(programs.programRow(programName)).toHaveCount(1);
        await expect(programs.heading).toBeVisible();
      } finally {
        await page.unrouteAll();
      }
    },
  );
});
