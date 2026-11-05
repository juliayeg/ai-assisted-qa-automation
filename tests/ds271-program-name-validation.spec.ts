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
  expectProgramsPageReady,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-271 — Program name validation and duplicate prevention (Raya)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('Accept program name with special characters', async ({ page }, testInfo) => {
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const description = `Advanced AI and informatics track ${suffix}`;

    await programs.goto();
    await expectProgramsPageReady(programs);
    await createProgramAndExpect(programs, programName, description);
    await expectProgramInList(programs, programName);
  });

  test('Reject program name with only whitespace', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('   ');

    await expect(modal.createButton).toBeDisabled();
    await modal.forceClickDisabledCreate();
    await expect(modal.dialog).toBeVisible();
  });

  test('Reject duplicate program name', async ({ page }, testInfo) => {
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

  test('Reject case-variant duplicate program name', async ({ page }, testInfo) => {
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

  test(
    'GET programs returns malformed JSON',
    { tag: '@programs-malformed-list' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);

      await page.route('**/api/programs**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{ not valid json',
          });
          return;
        }
        await route.continue();
      });

      try {
        await programs.goto();
        await expectProgramsPageReady(programs);

        await expect(async () => {
          const emptyVisible = await programs.emptyState.isVisible();
          const alertCount = await programs.errorAlerts.count();
          expect(
            emptyVisible || alertCount > 0,
            'Malformed list response should show an error or empty state without crashing',
          ).toBe(true);
        }).toPass({ timeout: 15_000 });
      } finally {
        await page.unrouteAll();
      }
    },
  );
});
