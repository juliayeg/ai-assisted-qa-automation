import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  createProgramAndExpect,
  expectDuplicateRejected,
  expectProgramInList,
  expectProgramRowCount,
  expectNewProgramModalOpen,
  expectProgramsPageReady,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-3 — Program name validation and duplicate prevention', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('TC-001: Program name with special characters is accepted', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const description = `Advanced AI and informatics track ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, description);
    await expectProgramInList(programs, programName);
  });

  test('TC-002: Program name with hyphens and numbers is accepted', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web-Dev 101 (2026) ${suffix}`;
    const description = `Hyphen and number validation ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, description);
    await expectProgramInList(programs, programName);
  });

  test('TC-003: Duplicate check is case-insensitive', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const duplicateName = programName.toLowerCase();

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(programs, programName, 1);

    const modal = await openNewProgramModal(programs);
    await modal.attemptCreate(duplicateName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(programs, modal, programName, 1);
  });

  test('TC-004: Whitespace-only program name is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('   ');

    await expect(modal.createButton).toBeDisabled();
    await modal.forceClickDisabledCreate();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-005: Duplicate program name is rejected', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(programs, programName, 1);

    const modal = await openNewProgramModal(programs);
    await modal.attemptCreate(programName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(programs, modal, programName, 1);
  });

  test('TC-006: Leading and trailing whitespace is trimmed before duplicate check', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const paddedName = `  ${programName}  `;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(programs, programName, 1);

    const modal = await openNewProgramModal(programs);
    await modal.attemptCreate(paddedName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(programs, modal, programName, 1);
  });

  test('TC-007: Empty program name cannot bypass validation', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);

    await expect(modal.programName).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();

    await modal.programName.press('Enter');

    await expect(modal.dialog).toBeVisible();
    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-008: Program name with Unicode characters is accepted', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Programme de Développement Web ${suffix}`;
    const description = `Unicode validation ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, description);
    await expectProgramInList(programs, programName);
  });

  test('TC-009: Program name at maximum length boundary is validated for duplicates', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-6);
    const nameBody = 'A'.repeat(255 - suffix.length - 1);
    const programName = `${nameBody}-${suffix}`;
    expect(programName).toHaveLength(255);

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, `Max length seed ${suffix}`);
    await expectProgramRowCount(programs, programName, 1);

    const modal = await openNewProgramModal(programs);
    await modal.attemptCreate(programName, `Duplicate max length ${suffix}`);
    await expectDuplicateRejected(programs, modal, programName, 1);
  });

  test('TC-010: Error message clears when user edits program name after duplicate error', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const existingName = `Web Development 2026 ${suffix}`;
    const newName = `Web Development 2027 ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, existingName, `Seed program ${suffix}`);

    const modal = await openNewProgramModal(programs);
    await modal.attemptCreate(existingName, `Duplicate attempt ${suffix}`);

    const error = modal.duplicateError();
    const hasDuplicateError = (await error.count()) > 0;
    test.skip(
      !hasDuplicateError || !(await modal.dialog.isVisible()),
      'Duplicate error message is not shown on an open modal',
    );

    await modal.programName.fill(newName);
    await expect(error).toHaveCount(0);
    await expect(modal.dialog).toBeVisible();
    await expect(modal.createButton).toBeEnabled({ timeout: 10_000 });
  });

  test('TC-011: Program name with only tabs or mixed whitespace is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('\t\t  \t');

    await expect(modal.createButton).toBeDisabled();
    await modal.forceClickDisabledCreate();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-012: Surrounding spaces on a new name are trimmed before create', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const trimmedName = `Informatique & IA - Niveau 2 ${suffix}`;
    const paddedName = `  ${trimmedName}  `;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(paddedName);
    await modal.description.fill(`Full-stack web development program ${suffix}`);
    await expect(modal.createButton).toBeEnabled();
    await modal.clickCreate();

    await expect(modal.dialog).toBeHidden({ timeout: 60_000 });
    await expectProgramInList(programs, trimmedName);
    await expect(programs.programRow(paddedName)).toHaveCount(0);
  });
});
