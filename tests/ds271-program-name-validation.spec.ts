import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { expectNoAxeViolations } from '../fixtures/a11y-expect';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  createProgramAndExpect,
  expectDuplicateRejected,
  expectProgramInList,
  expectProgramRowCount,
  expectNewProgramModalOpen,
  expectProgramsPageReady,
  gotoFreshProgramsPage,
  openNewProgramModal,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-271 — Program name validation and duplicate prevention (Raya)', () => {
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

  test('TC-002: Whitespace-only program name is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await openNewProgramModal(programs);
    await modal.programName.fill('   ');

    await expect(modal.createButton).toBeDisabled();
    await modal.forceClickDisabledCreate();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-003: Duplicate program name is rejected', async ({ page }, testInfo) => {
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

  test('TC-004: Case-variant duplicate program name is rejected', async ({ page }, testInfo) => {
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
    'TC-005: Programs list API returns malformed JSON — recoverable error state',
    { tag: '@programs-malformed-list' },
    async ({ page }) => {
      await page.route('**/api/programs', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{not-valid-json',
          });
          return;
        }
        await route.continue();
      });

      try {
        const programs = new ProgramsPage(page);
        await programs.goto();
        await expect(programs.heading).toBeVisible();
        await expect(programs.newProgramButton).toBeVisible();
        await expect(programs.errorAlerts.first()).toBeVisible({ timeout: 15_000 });
      } finally {
        await page.unrouteAll();
      }
    },
  );

  test(
    'TC-006: Programs page meets WCAG 2 A and AA via axe',
    { tag: '@regression' },
    async ({ page }) => {
      await gotoFreshProgramsPage(new ProgramsPage(page));
      await expectNoAxeViolations(page);
    },
  );

  test(
    'TC-007: Keyboard opens New Program dialog from Programs page',
    { tag: '@regression' },
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await gotoFreshProgramsPage(programs);
      const modal = programs.newProgramModal;

      await programs.tabUntilNewProgramButtonFocused();
      await expect(programs.newProgramButton).toBeFocused();
      await programs.pressEnter();

      await expect(modal.dialog).toBeVisible();
      await expectNewProgramModalOpen(modal);

      await modal.clickCancel();
      await expect(modal.dialog).toBeHidden();
    },
  );
});
