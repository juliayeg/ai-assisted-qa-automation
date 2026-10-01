import { test, expect, type Page, type Locator } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const emptyStateMessage = /no programs have been created|no programs yet|haven't created any programs/i;
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

async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireAdminCredentials();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function waitForProgramsListReady(page: Page): Promise<number> {
  await page.goto(`${baseURL}/programs`);
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Program' })).toBeVisible({
    timeout: 15_000,
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
  }).toPass({ timeout: 30_000 });

  return dataRows;
}

async function goToProgramsPage(page: Page): Promise<void> {
  await waitForProgramsListReady(page);
}

function uniqueSuffix(testId: string): string {
  return `${Date.now()}-${testId}`;
}

async function createProgram(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  await page.getByRole('button', { name: 'New Program' }).click();
  const modal = programFormModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  await modal.getByLabel('Program Name').fill(programName);
  if (description !== undefined) {
    await modal.getByLabel('Description').fill(description);
  }
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden({ timeout: 15_000 });
}

test.describe('DS-2 — Display program list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Program list shows name and description for each program', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const firstName = `Web Development 2026 ${suffix}`;
    const firstDescription = `Full-stack web development program ${suffix}`;
    const secondName = `Data Science Fundamentals ${suffix}`;
    const secondDescription = `Introductory data science track ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, firstName, firstDescription);
    await createProgram(page, secondName, secondDescription);

    const firstRow = programRow(page, firstName);
    const secondRow = programRow(page, secondName);

    await expect(firstRow.getByText(firstName, { exact: true })).toBeVisible();
    await expect(firstRow.getByText(firstDescription)).toBeVisible();
    await expect(secondRow.getByText(secondName, { exact: true })).toBeVisible();
    await expect(secondRow.getByText(secondDescription)).toBeVisible();
  });

  test('TC-002: Empty state message and create prompt shown when no programs exist', async ({
    page,
  }) => {
    const dataRows = await waitForProgramsListReady(page);
    test.skip(dataRows > 0, 'Precondition: no programs exist in the system');

    await expect(page.getByText(emptyStateMessage)).toBeVisible();
    await expect(page.getByRole('button', { name: createFirstProgramAction })).toBeVisible();
  });

  test('TC-003: Empty-state create prompt opens program creation form', async ({ page }) => {
    const dataRows = await waitForProgramsListReady(page);
    test.skip(dataRows > 0, 'Precondition: no programs exist in the system');

    const createPrompt = page.getByRole('button', { name: createFirstProgramAction }).first();
    await createPrompt.click();

    const modal = programFormModal(page);
    await expect(modal.getByLabel('Program Name')).toBeVisible();
    await expect(modal.getByLabel('Description')).toBeVisible();
  });

  test('TC-004: Newly created program appears in list without page refresh', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const existingName = `Existing Program ${suffix}`;
    const newName = `Mobile Development 2026 ${suffix}`;
    const newDescription = `Mobile apps curriculum ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, existingName, `Seed program ${suffix}`);

    await page.getByRole('button', { name: 'New Program' }).click();
    const modal = programFormModal(page);
    await modal.getByLabel('Program Name').fill(newName);
    await modal.getByLabel('Description').fill(newDescription);
    const createButton = modal.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeEnabled();
    await createButton.click();
    await expect(modal).toBeHidden({ timeout: 15_000 });

    const row = programRow(page, newName);
    await expect(row.getByText(newName, { exact: true })).toBeVisible();
    await expect(row.getByText(newDescription)).toBeVisible();
  });

  test('TC-006: Empty state is not shown when programs exist', async ({ page }) => {
    const programName = `List Seed Program ${Date.now()}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Ensures non-empty list ${Date.now()}`);

    await expect(page.getByText(emptyStateMessage)).toHaveCount(0);
    await expect(programsTable(page)).toBeVisible();
  });

  test('TC-007: Program with empty description does not break list display', async ({ page }) => {
    const programName = `Intro to Python ${Date.now()}`;

    await goToProgramsPage(page);
    await createProgram(page, programName);

    const row = programRow(page, programName);
    await expect(row.getByText(programName, { exact: true })).toBeVisible();
    await expect(programsTable(page)).toBeVisible();
    await expect(row).toBeVisible();
  });

  test('TC-008: Program with special characters in name displays correctly', async ({ page }) => {
    const suffix = Date.now();
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const description = `Advanced AI track ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, description);

    const row = programRow(page, programName);
    await expect(row.getByText(programName, { exact: true })).toBeVisible();
    await expect(row.getByText(description)).toBeVisible();
  });

  test('TC-009: Large number of programs renders without performance degradation', async ({
    page,
  }) => {
    const startedAt = Date.now();
    const dataRows = await waitForProgramsListReady(page);
    const loadMs = Date.now() - startedAt;

    test.skip(dataRows < 100, 'Precondition: 100+ programs exist in the system');

    expect(loadMs).toBeLessThan(15_000);
    await page.mouse.wheel(0, 2_000);
    await expect(programsTable(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  });

  test('TC-010: Long description is displayed without breaking list layout', async ({ page }) => {
    const suffix = Date.now();
    const programName = `Long Description Program ${suffix}`;
    const longDescription = `Long list description ${suffix} ${'y'.repeat(500)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, longDescription);

    const row = programRow(page, programName);
    await expect(row.getByText(programName, { exact: true })).toBeVisible();
    await expect(programsTable(page)).toBeVisible();
    await expect(row).toBeVisible();
  });
});

test.describe('DS-2 — Display program list (unauthenticated)', () => {
  test('TC-005: Program list is not shown to unauthenticated users', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseURL}/programs`);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(programsTable(page)).toHaveCount(0);
  });
});
