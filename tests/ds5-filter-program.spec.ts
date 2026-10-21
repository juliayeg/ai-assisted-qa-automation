import {
  test,
  expect,
  captureApiTokenFromPage,
  trackProgramCreatesFromResponses,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  createProgramAndReturnToList,
  expectProgramsListReady,
  gotoProgramsAndReady,
  requireProgramFilterOrSkip,
  skipIfFilterUnavailable,
} from '../fixtures/programs-page-expect';
import { uniqueSuffix } from '../fixtures/test-data';

test.describe('DS-5 — Program list filtering and display', () => {
  test.beforeEach(async ({ page, trackProgram, apiToken }) => {
    captureApiTokenFromPage(page, apiToken);
    trackProgramCreatesFromResponses(page, trackProgram);
  });

  test('TC-001: Program list shows name and description for each program', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programList = [
      {
        name: `Web Development 2026 ${suffix}`,
        description: `Full-stack web development program ${suffix}`,
      },
      {
        name: `Data Science Fundamentals ${suffix}`,
        description: `Introductory data science track ${suffix}`,
      },
      {
        name: `Cybersecurity Basics ${suffix}`,
        description: `Security fundamentals ${suffix}`,
      },
    ];

    await gotoProgramsAndReady(programs);
    for (const program of programList) {
      await createProgramAndReturnToList(programs, program.name, program.description);
    }

    for (const program of programList) {
      const row = programs.programRow(program.name);
      await expect(programs.rowText(row, program.name, true)).toBeVisible();
      await expect(programs.rowText(row, program.description)).toBeVisible();
    }
  });

  test('TC-002: Empty state shown when no programs match and none exist', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const dataRows = await expectProgramsListReady(programs);
    test.skip(dataRows > 0, 'Precondition: no programs exist in the system');

    await expect(programs.emptyState).toBeVisible();
    await expect(programs.createFirstProgramButton).toBeVisible();
  });

  test('TC-003: Filter by program name returns matching programs only', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;
    const webDesign = `Web Design Intro ${suffix}`;

    for (const [name, desc] of [
      [webDev, `Desc A ${suffix}`],
      [dataScience, `Desc B ${suffix}`],
      [webDesign, `Desc C ${suffix}`],
    ] as const) {
      await createProgramAndReturnToList(programs, name, desc);
    }

    await programs.applyFilter('Web');
    await expect(programs.programRow(webDev)).toBeVisible();
    await expect(programs.programRow(webDesign)).toBeVisible();
    await expect(programs.programRow(dataScience)).toHaveCount(0);
  });

  test('TC-004: Filter is case-insensitive', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, programName, `Seed ${suffix}`);

    await programs.applyFilter('web development');
    await expect(programs.programRow(programName)).toBeVisible();
  });

  test('TC-005: Clearing filter restores full program list', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, webDev, `Web desc ${suffix}`);
    await createProgramAndReturnToList(programs, dataScience, `DS desc ${suffix}`);

    await programs.applyFilter('Web');
    await expect(programs.programRow(webDev)).toBeVisible();
    await expect(programs.programRow(dataScience)).toHaveCount(0);

    await programs.clearFilter();
    await expect(programs.programRow(webDev)).toBeVisible();
    await expect(programs.programRow(dataScience)).toBeVisible();
  });

  test('TC-006: No results message shown when filter matches nothing', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, `Web Development 2026 ${suffix}`, `Desc ${suffix}`);
    await createProgramAndReturnToList(
      programs,
      `Data Science Fundamentals ${suffix}`,
      `Desc2 ${suffix}`,
    );

    await programs.applyFilter(`Nonexistent Program XYZ ${suffix}`);
    await expect(programs.programRow(suffix)).toHaveCount(0);
    await expect(programs.noMatchState).toBeVisible();
  });

  test('TC-007: Filter does not modify underlying program data', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const names = [
      `Web Development 2026 ${suffix}`,
      `Web Design Intro ${suffix}`,
      `Data Science Fundamentals ${suffix}`,
    ];

    await gotoProgramsAndReady(programs);
    for (const name of names) {
      await createProgramAndReturnToList(programs, name, `Description for ${name}`);
    }

    await programs.applyFilter('Web');
    await programs.clearFilter();

    for (const name of names) {
      const row = programs.programRow(name);
      await expect(programs.rowText(row, name, true)).toBeVisible();
      await expect(programs.rowText(row, `Description for ${name}`)).toBeVisible();
    }
  });

  test('TC-008: Empty state is not shown when programs exist but filter returns no matches', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, programName, `Seed ${suffix}`);

    await programs.applyFilter(`NoMatch-${suffix}`);
    await expect(programs.emptyState).toHaveCount(0);
    await expect(programs.noMatchState).toBeVisible();
  });

  test('TC-009: Filter matches program description text', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Intro to Python ${suffix}`;
    const description = `Full-stack web development program ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, programName, description);

    await programs.applyFilter('Full-stack');
    await expect(programs.programRow(programName)).toBeVisible();
  });

  test('TC-010: Filter with special characters returns correct results', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, programName, `Advanced AI track ${suffix}`);

    await programs.applyFilter('Informatique & IA');
    await expect(programs.programRow(programName)).toBeVisible();
  });

  test('TC-011: Filter with whitespace-only input shows all programs or no filter applied', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const nameA = `Web Development 2026 ${suffix}`;
    const nameB = `Data Science Fundamentals ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, nameA, `A ${suffix}`);
    await createProgramAndReturnToList(programs, nameB, `B ${suffix}`);

    await programs.applyFilter('   ');
    await expect(programs.programRow(nameA)).toBeVisible();
    await expect(programs.programRow(nameB)).toBeVisible();
  });

  test('TC-012: Filter updates results as user types (live search)', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, webDev, `Web ${suffix}`);
    await createProgramAndReturnToList(programs, dataScience, `DS ${suffix}`);

    await skipIfFilterUnavailable(programs);
    await programs.typeFilterIncrementally(['W', 'We', 'Web']);

    await expect(programs.programRow(webDev)).toBeVisible();
    await expect(programs.programRow(dataScience)).toHaveCount(0);
  });

  test('TC-013: Filter persists or resets after navigating away and back', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programs = new ProgramsPage(page);
    await requireProgramFilterOrSkip(programs);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await gotoProgramsAndReady(programs);
    await createProgramAndReturnToList(programs, webDev, `Web ${suffix}`);
    await createProgramAndReturnToList(programs, dataScience, `DS ${suffix}`);

    await skipIfFilterUnavailable(programs);
    await programs.programFilter.fill('Web');
    const filterBeforeLeave = await programs.programFilter.inputValue();

    await programs.navigateToDashboard();
    await expect(programs.dashboardHeading).toBeVisible({ timeout: 15_000 });
    await programs.navigateToProgramsFromNav();
    await expect(programs.heading).toBeVisible();

    const filterAfterReturn = programs.programFilter;
    await expect(filterAfterReturn).toBeVisible();
    const valueAfterReturn = await filterAfterReturn.inputValue();

    if (valueAfterReturn === filterBeforeLeave) {
      await expect(programs.programRow(webDev)).toBeVisible();
      await expect(programs.programRow(dataScience)).toHaveCount(0);
    } else {
      expect(valueAfterReturn).toBe('');
      await expect(programs.programRow(webDev)).toBeVisible();
      await expect(programs.programRow(dataScience)).toBeVisible();
    }
  });
});
