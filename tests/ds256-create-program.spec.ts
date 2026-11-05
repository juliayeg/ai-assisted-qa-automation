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
  expectNewProgramModalOpen,
  expectProgramInList,
  expectProgramRowCount,
  gotoProgramsAndReady,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-256 — Create new academic program (Valeria)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('Navigate to program creation form', async ({ page }) => {
    const programs = new ProgramsPage(page);

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programName).toBeEditable();
    await expect(modal.description).toBeEditable();
  });

  test('Successfully create a program', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const programDescription = `Full-stack web development program ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, programDescription, {
      hideTimeout: 20_000,
    });
    await expectProgramInList(programs, programName);
  });

  test('Validation prevents empty program name', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.description.fill(`Full-stack web development program ${uniqueSuffix(testInfo.testId)}`);

    await expect(modal.programName).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();
    await expect(programs.programRow('')).toHaveCount(0);
  });

  test('Whitespace-only Program Name does not create a program', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('   ');
    await modal.description.fill(`Full-stack web development program ${uniqueSuffix(testInfo.testId)}`);

    await expect(modal.createButton).toBeDisabled();
  });

  test('Duplicate program name is rejected', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const programDescription = `Full-stack web development program ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, programDescription, {
      hideTimeout: 20_000,
    });
    await expectProgramRowCount(programs, programName, 1);

    const modal = await openNewProgramModal(programs);
    await modal.programName.fill(programName);
    await modal.description.fill(programDescription);
    await expect(modal.createButton).toBeEnabled();
    await modal.clickCreate();

    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
    await expectDuplicateRejected(programs, modal, programName, 1);
    if ((await modal.duplicateError().count()) > 0) {
      await expect(modal.duplicateError()).toBeVisible();
    }
  });

  test('Program Name with special characters is created', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 — C# & .NET ${suffix}`;
    const programDescription = `Full-stack web development program ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndExpect(programs, programName, programDescription, {
      hideTimeout: 20_000,
    });
    await expectProgramInList(programs, programName);
  });

  test(
    'Programs API returns 503 on create save',
    { tag: '@programs-503-save' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const suffix = uniqueSuffix(testInfo.testId);
      const programName = `503 Save Failure ${suffix}`;
      const programDescription = `Should not persist ${suffix}`;

      await page.route('**/api/programs**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service Unavailable' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const modal = await openNewProgramModal(programs);
        await modal.programName.fill(programName);
        await modal.description.fill(programDescription);
        await expect(modal.createButton).toBeEnabled();
        await modal.clickCreate();

        await expect(programs.programRow(programName)).toHaveCount(0, { timeout: 15_000 });

        await expect(async () => {
          const modalStillOpen = await modal.dialog.isVisible();
          const alertCount = await programs.errorAlerts.count();
          expect(
            modalStillOpen || alertCount > 0,
            '503 on save should show an error state (modal open and/or alert)',
          ).toBe(true);
        }).toPass({ timeout: 15_000 });
      } finally {
        await page.unrouteAll();
      }
    },
  );

  test(
    'Programs list API returns empty array',
    { tag: '@programs-empty-list' },
    async ({ page }) => {
      await page.route('**/api/programs', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const programs = new ProgramsPage(page);
        await programs.goto();
        await expect(programs.heading).toBeVisible();
        await expect(programs.emptyState).toBeVisible();
        await expect(programs.createFirstProgramButton).toBeVisible();
      } finally {
        await page.unrouteAll();
      }
    },
  );
});
