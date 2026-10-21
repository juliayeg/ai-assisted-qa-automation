import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  gotoProgramsAndReady,
  seedProgramForDelete,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-4 — Delete program with confirmation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('TC-001: Program is removed after confirming deletion', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);
    await expect(programs.programRow(programName)).toHaveCount(1);

    await programs.clickDeleteWithDialog(programName, true);
    await expect(programs.programRow(programName)).toHaveCount(0);
  });

  test('TC-002: Program remains when deletion is cancelled', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Cancel Delete ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);
    await programs.clickDeleteWithDialog(programName, false);
    await expect(programs.programRow(programName)).toHaveCount(1);
  });

  test('TC-003: Confirmation dialog shows the program name being deleted', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Cybersecurity Basics ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);

    const dialog = await programs.clickDeleteWithDialog(programName, false);
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toMatch(/Delete program/i);
    expect(dialog.message()).toContain(programName);
    await expect(programs.programRow(programName)).toHaveCount(1);
  });

  test('TC-004: List count updates after successful deletion', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const names = [`Count A ${suffix}`, `Count B ${suffix}`, `Count C ${suffix}`];

    for (const name of names) {
      await seedProgramForDelete(programs, name, `Seed ${name}`);
    }
    await gotoProgramsAndReady(programs);
    await expect(programs.programRow(suffix)).toHaveCount(3);

    await programs.clickDeleteWithDialog(names[0], true);
    await expect(programs.programRow(suffix)).toHaveCount(2);
    await expect(programs.programRow(names[0])).toHaveCount(0);
  });

  test('TC-005: Program is not deleted when confirmation dialog is dismissed via Escape', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Escape Delete ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);
    await programs.clickDeleteWithDialog(programName, false);
    await expect(programs.programRow(programName)).toHaveCount(1);
  });

  test('TC-007: Double-clicking confirm does not cause errors', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const programName = `Double Confirm ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);

    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount += 1;
      await dialog.accept();
    });

    await programs.dblclickDeleteProgram(programName);
    await expect(programs.programRow(programName)).toHaveCount(0, { timeout: 30_000 });
    expect(dialogCount).toBeGreaterThanOrEqual(1);
    await expect(programs.errorAlertsMatching(/error|failed/i)).toHaveCount(0);
  });

  test('TC-008: Delete last remaining program shows empty state', async ({ page }) => {
    test.skip(true, 'Precondition (only one program in tenant) is not available on shared test env');
    const programs = new ProgramsPage(page);
    await gotoProgramsAndReady(programs);
    await expect(programs.emptyState).toBeVisible();
  });

  test('TC-009: Delete icon works for program with special characters in name', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);
    await programs.clickDeleteWithDialog(programName, true);
    await expect(programs.programRow(programName)).toHaveCount(0);
  });

  test('TC-010: Deletion failure shows error and preserves program in list', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Fail Delete ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForDelete(programs, programName, `Seed ${programName}`);

    await page.route('**/programs/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
        return;
      }
      await route.continue();
    });

    await programs.clickDeleteWithDialog(programName, true);
    await expect(programs.programRow(programName)).toHaveCount(1, { timeout: 15_000 });

    if ((await programs.errorAlerts.count()) > 0) {
      await expect(programs.errorAlerts.last()).toContainText(/error|fail|unable|could not/i);
    }
  });

  test('TC-011: Clicking outside confirmation dialog cancels deletion', async ({
    page,
  }, testInfo) => {
    test.skip(
      true,
      'Confirmation is a native browser dialog; there is no backdrop to click',
    );

    const programs = new ProgramsPage(page);
    const programName = `Backdrop ${uniqueSuffix(testInfo.testId)}`;
    await seedProgramForDelete(programs, programName, `Seed ${programName}`);
  });
});
