import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  openEditProgramModal,
  saveEditProgram,
  seedProgramForEdit,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-2 — Edit existing program details', () => {
  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('TC-001: Edit icon opens the Edit Program modal with current data', async ({
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

  test('TC-002: Saving a new Program Name updates the list immediately', async ({
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
    await expect(programs.deleteProgramButton(updatedName)).toBeVisible();
    await expect(programs.editProgramButton(originalName)).toHaveCount(0);
    await expect(programs.programRowByEditButton(updatedName)).toContainText(description);
  });

  test('TC-003: Description-only edit leaves Program Name and other fields unchanged', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Preserve Fields ${suffix}`;
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
    await expect(programs.editProgramButton(programName)).toBeVisible();
  });

  test('TC-004: Clearing Description is allowed and does not remove the program', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Clear Description ${suffix}`;

    await seedProgramForEdit(programs, programName, `Will be cleared ${suffix}`);

    const modal = await openEditProgramModal(programs, programName);
    await modal.description.fill('');
    await saveEditProgram(modal);

    await expect(programs.editProgramButton(programName)).toBeVisible();
    const reopened = await openEditProgramModal(programs, programName);
    await expect(reopened.description).toHaveValue('');
    await expect(reopened.programName).toHaveValue(programName);
  });

  test('TC-006: Save stays disabled when Program Name is empty', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const programName = `Empty Name Guard ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForEdit(programs, programName, 'Keep name required');

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill('');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-007: Cancel discards unsaved edits', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Cancel Edit ${suffix}`;
    const description = `Original ${suffix}`;

    await seedProgramForEdit(programs, programName, description);

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill(`${programName} SHOULD NOT SAVE`);
    await modal.description.fill('Cancel should discard this');
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programs.editProgramButton(programName)).toBeVisible();
    await expect(programs.editProgramButton(`${programName} SHOULD NOT SAVE`)).toHaveCount(0);

    const reopened = await openEditProgramModal(programs, programName);
    await expect(reopened.programName).toHaveValue(programName);
    await expect(reopened.description).toHaveValue(description);
  });

  test('TC-008: Clicking the program name cell does not open the edit form', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const programName = `Row Click ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForEdit(programs, programName, 'Clicking the name should not edit');
    await programs.programNameCell(programName).click();

    await expect(programs.editProgramModal.dialog).toHaveCount(0);
    await expect(programs.page).toHaveURL(/\/programs/);
  });

  test('TC-009: Whitespace-only Program Name keeps Save disabled', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const programName = `Whitespace Name ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForEdit(programs, programName, 'Whitespace should not save');

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill('   ');

    await expect(modal.saveButton).toBeDisabled();
  });

  test('TC-010: Escape from Program Name closes modal without saving', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const programName = `Escape Edit ${uniqueSuffix(testInfo.testId)}`;

    await seedProgramForEdit(programs, programName, 'Escape discard');

    const modal = await openEditProgramModal(programs, programName);
    await modal.programName.fill(`${programName} ESC`);
    await modal.pressEscapeFromProgramName();

    await expect(modal.dialog).toBeHidden();
    await expect(programs.editProgramButton(programName)).toBeVisible();
    await expect(programs.editProgramButton(`${programName} ESC`)).toHaveCount(0);
  });

  test('TC-011: Modal X close discards unsaved edits', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Close Icon ${suffix}`;
    const description = `Keep this ${suffix}`;

    await seedProgramForEdit(programs, programName, description);

    const modal = await openEditProgramModal(programs, programName);
    await modal.description.fill('X close should discard');
    await modal.clickClose();

    await expect(modal.dialog).toBeHidden();

    const reopened = await openEditProgramModal(programs, programName);
    await expect(reopened.description).toHaveValue(description);
  });

  test('TC-012: Special characters in an edited name display correctly', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const originalName = `Special Name Seed ${suffix}`;
    const updatedName = `Informatique & IA - Niveau 2 ${suffix}`;

    await seedProgramForEdit(programs, originalName, `Advanced AI track ${suffix}`);

    const modal = await openEditProgramModal(programs, originalName);
    await modal.programName.fill(updatedName);
    await saveEditProgram(modal);

    await expect(programs.editProgramButton(updatedName)).toBeVisible({ timeout: 30_000 });
    await expect(programs.editProgramButton(originalName)).toHaveCount(0);
  });

  test('TC-013: Duplicate program name on edit should be rejected', async ({
    page,
  }, testInfo) => {
    test.fail(true, 'Known defect: edit accepts a name that already exists (DS-13 / DS-122)');
    test.setTimeout(180_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const firstName = `Alpha ${suffix}`;
    const secondName = `Beta ${suffix}`;

    await seedProgramForEdit(programs, firstName, `First ${suffix}`);
    await seedProgramForEdit(programs, secondName, `Second ${suffix}`);

    const modal = await openEditProgramModal(programs, secondName);
    await modal.programName.fill(firstName);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(programs.editProgramButton(secondName)).toHaveCount(1);
    await expect(programs.editProgramButton(firstName)).toHaveCount(1);
  });
});

test.describe('DS-2 — Edit existing program details (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-005: Unauthenticated users cannot open program edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const login = new LoginPage(page);

    await programs.goto();

    await expect(login.page).toHaveURL(/\/login/);
    await expect(login.email).toBeVisible();
    await expect(programs.anyEditButton).toHaveCount(0);
    await expect(programs.table).toHaveCount(0);
  });
});
