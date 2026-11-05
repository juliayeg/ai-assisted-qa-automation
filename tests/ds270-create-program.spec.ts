import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { expectNoAxeViolations, runA11yCheck } from '../fixtures/a11y-expect';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  createProgramAndExpect,
  expectNewProgramModalOpen,
  expectProgramInList,
  gotoProgramsAndReady,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-270 — Create new academic program (Raya)', () => {
  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('Navigate to program creation form shows Program Name and Description', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);

    await gotoProgramsAndReady(programs);
    await programs.openNewProgramForm();
    const modal = programs.newProgramModal;
    await expectNewProgramModalOpen(modal);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programName).toBeEditable();
    await expect(modal.description).toBeEditable();
  });

  test('Successfully create a program closes modal and lists the new program', async ({
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
  });

  test('Validation prevents empty program name when description is filled', async ({
    page,
  }, testInfo) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);

    await expect(modal.programName).toHaveValue('');
    await modal.description.fill(
      `Full-stack web development program ${uniqueSuffix(testInfo.testId)}`,
    );

    await expect(modal.createButton).toBeDisabled();
    await expect(programs.programRow('')).toHaveCount(0);
  });

  test(
    'Programs create API 503 shows error and does not list the program',
    { tag: '@programs-503-save' },
    async ({ page }, testInfo) => {
      const programs = new ProgramsPage(page);
      const suffix = uniqueSuffix(testInfo.testId);
      const programName = `Web Development 2026 ${suffix}`;
      const programDescription = `Full-stack web development program ${suffix}`;

      await page.route('**/api/programs**', async (route) => {
        if (route.request().method() === 'POST') {
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
        const modal = await openNewProgramModal(programs);
        await modal.programName.fill(programName);
        await modal.description.fill(programDescription);
        await modal.clickCreate();

        await expect(async () => {
          const alertVisible = await programs.errorAlerts.isVisible();
          const modalStillOpen = await modal.dialog.isVisible();
          expect(alertVisible || modalStillOpen).toBe(true);
        }).toPass({ timeout: 15_000 });

        await expect(programs.programRow(programName)).toHaveCount(0);
      } finally {
        await page.unrouteAll();
      }
    },
  );

  test(
    'Programs page meets WCAG 2 A and AA via axe',
    { tag: '@ds270-a11y-axe' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await gotoProgramsAndReady(programs);
      await expectNoAxeViolations(page);
    },
  );

  test(
    'Keyboard opens New Program dialog from Programs page',
    { tag: '@ds270-a11y-keyboard' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await gotoProgramsAndReady(programs);

      await runA11yCheck('ds270-keyboard-new-program-dialog', async () => {
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
