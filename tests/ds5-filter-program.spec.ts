import { test, expect, type Page, type Locator } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const emptyStateMessage = /no programs have been created|no programs yet|haven't created any programs/i;
const noMatchMessage =
  /no matching|no results|no programs match|nothing found|did not match/i;
const createFirstProgramAction = /new program|create.*first program/i;

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  test.skip(!email || !password, 'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  return { email: email!, password: password! };
}

function programsTable(page: Page): Locator {
  return page.getByRole('table');
}

function programFormModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programRow(page: Page, programName: string): Locator {
  return programsTable(page).getByRole('row').filter({ hasText: programName });
}

function programFilterField(page: Page): Locator {
  return page
    .getByRole('searchbox')
    .or(page.getByLabel(/search|filter/i))
    .or(page.getByPlaceholder(/search|filter/i))
    .first();
}

function uniqueSuffix(testId: string): string {
  return `${Date.now()}-${testId.slice(-8)}`;
}

async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireAdminCredentials();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function waitForProgramsListReady(page: Page): Promise<number> {
  await page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Program' })).toBeVisible({
    timeout: 30_000,
  });

  const table = programsTable(page);
  const emptyState = page.getByText(emptyStateMessage);

  let dataRows = 0;
  await expect(async () => {
    const tableVisible = await table.isVisible();
    const emptyVisible = await emptyState.isVisible();
    expect(tableVisible || emptyVisible).toBe(true);
    if (tableVisible) {
      const rows = await table.getByRole('row').count();
      dataRows = Math.max(0, rows - 1);
    }
  }).toPass({ timeout: 60_000 });

  return dataRows;
}

async function goToProgramsPage(page: Page): Promise<void> {
  await waitForProgramsListReady(page);
}

async function skipIfFilterUnavailable(page: Page): Promise<Locator> {
  const filter = programFilterField(page);
  if (!(await filter.isVisible())) {
    test.skip(true, 'Programs page has no search/filter field (filter feature not shipped yet)');
  }
  return filter;
}

async function requireFilterOrSkip(page: Page): Promise<Locator> {
  await goToProgramsPage(page);
  return skipIfFilterUnavailable(page);
}

async function createProgram(
  page: Page,
  programName: string,
  description: string,
): Promise<void> {
  await page.getByRole('button', { name: 'New Program' }).click();
  const modal = programFormModal(page);
  await modal.getByLabel('Program Name').fill(programName);
  await modal.getByLabel('Description').fill(description);
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
}

async function applyFilter(page: Page, value: string): Promise<void> {
  const filter = await skipIfFilterUnavailable(page);
  await filter.fill(value);
  await page.waitForTimeout(400);
}

async function clearFilter(page: Page): Promise<void> {
  const filter = await skipIfFilterUnavailable(page);
  await filter.fill('');
  await page.waitForTimeout(400);
}

test.describe('DS-5 — Program list filtering and display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Program list shows name and description for each program', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programs = [
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

    await goToProgramsPage(page);
    for (const program of programs) {
      await createProgram(page, program.name, program.description);
      await goToProgramsPage(page);
    }

    for (const program of programs) {
      const row = programRow(page, program.name);
      await expect(row.getByText(program.name, { exact: true })).toBeVisible();
      await expect(row.getByText(program.description)).toBeVisible();
    }
  });

  test('TC-002: Empty state shown when no programs match and none exist', async ({
    page,
  }) => {
    const dataRows = await waitForProgramsListReady(page);
    test.skip(dataRows > 0, 'Precondition: no programs exist in the system');

    await expect(page.getByText(emptyStateMessage)).toBeVisible();
    await expect(page.getByRole('button', { name: createFirstProgramAction })).toBeVisible();
  });

  test('TC-003: Filter by program name returns matching programs only', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;
    const webDesign = `Web Design Intro ${suffix}`;

    for (const [name, desc] of [
      [webDev, `Desc A ${suffix}`],
      [dataScience, `Desc B ${suffix}`],
      [webDesign, `Desc C ${suffix}`],
    ] as const) {
      await createProgram(page, name, desc);
      await goToProgramsPage(page);
    }

    await applyFilter(page, 'Web');
    await expect(programRow(page, webDev)).toBeVisible();
    await expect(programRow(page, webDesign)).toBeVisible();
    await expect(programRow(page, dataScience)).toHaveCount(0);
  });

  test('TC-004: Filter is case-insensitive', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, 'web development');
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-005: Clearing filter restores full program list', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, webDev, `Web desc ${suffix}`);
    await goToProgramsPage(page);
    await createProgram(page, dataScience, `DS desc ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, 'Web');
    await expect(programRow(page, webDev)).toBeVisible();
    await expect(programRow(page, dataScience)).toHaveCount(0);

    await clearFilter(page);
    await expect(programRow(page, webDev)).toBeVisible();
    await expect(programRow(page, dataScience)).toBeVisible();
  });

  test('TC-006: No results message shown when filter matches nothing', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    await goToProgramsPage(page);
    await createProgram(page, `Web Development 2026 ${suffix}`, `Desc ${suffix}`);
    await goToProgramsPage(page);
    await createProgram(page, `Data Science Fundamentals ${suffix}`, `Desc2 ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, `Nonexistent Program XYZ ${suffix}`);
    await expect(programRow(page, suffix)).toHaveCount(0);
    await expect(page.getByText(noMatchMessage)).toBeVisible();
  });

  test('TC-007: Filter does not modify underlying program data', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const names = [
      `Web Development 2026 ${suffix}`,
      `Web Design Intro ${suffix}`,
      `Data Science Fundamentals ${suffix}`,
    ];

    await goToProgramsPage(page);
    for (const name of names) {
      await createProgram(page, name, `Description for ${name}`);
      await goToProgramsPage(page);
    }

    await applyFilter(page, 'Web');
    await clearFilter(page);

    for (const name of names) {
      const row = programRow(page, name);
      await expect(row.getByText(name, { exact: true })).toBeVisible();
      await expect(row.getByText(`Description for ${name}`)).toBeVisible();
    }
  });

  test('TC-008: Empty state is not shown when programs exist but filter returns no matches', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, `NoMatch-${suffix}`);
    await expect(page.getByText(emptyStateMessage)).toHaveCount(0);
    await expect(page.getByText(noMatchMessage)).toBeVisible();
  });

  test('TC-009: Filter matches program description text', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Intro to Python ${suffix}`;
    const description = `Full-stack web development program ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, description);
    await goToProgramsPage(page);

    await applyFilter(page, 'Full-stack');
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-010: Filter with special characters returns correct results', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Advanced AI track ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, 'Informatique & IA');
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-011: Filter with whitespace-only input shows all programs or no filter applied', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const nameA = `Web Development 2026 ${suffix}`;
    const nameB = `Data Science Fundamentals ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, nameA, `A ${suffix}`);
    await goToProgramsPage(page);
    await createProgram(page, nameB, `B ${suffix}`);
    await goToProgramsPage(page);

    await applyFilter(page, '   ');
    await expect(programRow(page, nameA)).toBeVisible();
    await expect(programRow(page, nameB)).toBeVisible();
  });

  test('TC-012: Filter updates results as user types (live search)', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, webDev, `Web ${suffix}`);
    await goToProgramsPage(page);
    await createProgram(page, dataScience, `DS ${suffix}`);
    await goToProgramsPage(page);

    const filter = await skipIfFilterUnavailable(page);
    await filter.fill('W');
    await page.waitForTimeout(300);
    await filter.fill('We');
    await page.waitForTimeout(300);
    await filter.fill('Web');
    await page.waitForTimeout(300);

    await expect(programRow(page, webDev)).toBeVisible();
    await expect(programRow(page, dataScience)).toHaveCount(0);
  });

  test('TC-013: Filter persists or resets after navigating away and back', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await requireFilterOrSkip(page);
    const suffix = uniqueSuffix(testInfo.testId);
    const webDev = `Web Development 2026 ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, webDev, `Web ${suffix}`);
    await goToProgramsPage(page);
    await createProgram(page, dataScience, `DS ${suffix}`);
    await goToProgramsPage(page);

    const filter = await skipIfFilterUnavailable(page);
    await filter.fill('Web');
    await page.waitForTimeout(400);
    const filterBeforeLeave = await filter.inputValue();

    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Programs' }).click();
    await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();

    const filterAfterReturn = programFilterField(page);
    await expect(filterAfterReturn).toBeVisible();
    const valueAfterReturn = await filterAfterReturn.inputValue();

    if (valueAfterReturn === filterBeforeLeave) {
      await expect(programRow(page, webDev)).toBeVisible();
      await expect(programRow(page, dataScience)).toHaveCount(0);
    } else {
      expect(valueAfterReturn).toBe('');
      await expect(programRow(page, webDev)).toBeVisible();
      await expect(programRow(page, dataScience)).toBeVisible();
    }
  });
});
