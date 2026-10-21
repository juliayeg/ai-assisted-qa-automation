import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  createProgramAndExpect,
  expectNewProgramModalOpen,
  expectProgramInList,
  expectProgramRowCount,
  gotoProgramsAndReady,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-1 — Create new academic program', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('TC-001: Program creation form displays required fields', async ({ page }) => {
    const programs = new ProgramsPage(page);

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programName).toBeEditable();
    await expect(modal.description).toBeEditable();
  });

  test('TC-002: New program appears in list after successful creation', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const programDescription = `Full-stack web development program ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, programDescription, {
      hideTimeout: 20_000,
    });
    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText(programDescription);
  });

  test('TC-003: Program is created with description only when name is provided', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const programName = `Data Science Fundamentals ${uniqueSuffix(testInfo.testId)}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, undefined, { hideTimeout: 20_000 });
    await expectProgramInList(programs, programName);
  });

  test('TC-004: Create button remains disabled when program name is empty', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);

    await expect(modal.programName).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-005: Program is not created when form is submitted with empty name', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.description.fill(`Optional description only ${uniqueSuffix(testInfo.testId)}`);

    await expect(modal.createButton).toBeDisabled();
    await modal.submitProgramNameWithEnter();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.programName).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-007: Program name at 100 characters is accepted', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-6);
    const nameBody = 'A'.repeat(100 - suffix.length - 1);
    const programName = `${nameBody}-${suffix}`;
    expect(programName).toHaveLength(100);

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(
      programs,
      programName,
      `Boundary length test program ${Date.now()}`,
      { hideTimeout: 20_000 },
    );
    await expectProgramInList(programs, programName);
  });

  test('TC-008: Program name over 100 characters should be rejected', async ({
    page,
  }, testInfo) => {
    test.fail(true, 'Known defect: names over 100 characters are accepted (DS-124)');

    const programs = new ProgramsPage(page);
    const longName = `B${'b'.repeat(99)}-${uniqueSuffix(testInfo.testId)}`;
    expect(longName.length).toBeGreaterThan(100);

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(longName);

    await expect(modal.createButton).toBeDisabled();
    await expect(programs.programRow(longName)).toHaveCount(0);
  });

  test('TC-009: Modal closes without saving when Cancel is clicked', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const draftName = `Draft Program ${uniqueSuffix(testInfo.testId)}`;

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(draftName);
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programs.programRow(draftName)).toHaveCount(0);
  });

  test('TC-010: Description field accepts long text without breaking layout', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Cloud Computing 2026 ${suffix}`;
    const longDescription = `Long description ${suffix} ${'x'.repeat(2000)}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, longDescription, { hideTimeout: 20_000 });
    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText('Long description');
  });

  test('TC-011: Whitespace-only program name keeps Create disabled', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('   ');

    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-012: Escape closes modal without saving', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const draftName = `Draft Esc ${uniqueSuffix(testInfo.testId)}`;

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(draftName);
    await programs.pressEscape();

    await expect(modal.dialog).toBeHidden();
    await expect(programs.programRow(draftName)).toHaveCount(0);
  });

  test('TC-013: Double-click Create should not create duplicate programs', async ({
    page,
  }, testInfo) => {
    test.fail(true, 'Known defect: double-click Create creates duplicate rows (DS-110)');

    const programs = new ProgramsPage(page);
    const programName = `Double Click ${uniqueSuffix(testInfo.testId)}`;

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(programName);
    await modal.dblclickCreate();

    await expect(programs.programRow(programName)).toHaveCount(1, { timeout: 15_000 });
  });

  test('TC-014: Duplicate program name should be rejected', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const programName = `Existing Program ${uniqueSuffix(testInfo.testId)}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, undefined, { hideTimeout: 20_000 });
    await expectProgramRowCount(programs, programName, 1);

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);
    await modal.programName.fill(programName);
    await modal.description.fill('Duplicate attempt');
    await expect(modal.createButton).toBeEnabled();
    await modal.clickCreate();

    await expect(async () => {
      expect(await programs.programRow(programName).count()).toBe(1);
    }).toPass({ timeout: 15_000 });
  });
});
