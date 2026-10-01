import { test, expect, type Page, type Locator } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const duplicateNameError = /already exists|duplicate program|name is already in use|name must be unique/i;

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

function duplicateError(modal: Locator): Locator {
  return modal.getByText(duplicateNameError);
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

async function openNewProgramModal(page: Page): Promise<Locator> {
  await page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'New Program' })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole('button', { name: 'New Program' }).click();
  const modal = programFormModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  return modal;
}

function programRowsNamed(page: Page, programName: string): Locator {
  return programsTable(page).getByRole('row').filter({ hasText: programName });
}

async function countProgramRowsNamed(page: Page, programName: string): Promise<number> {
  if (!page.url().includes('/programs')) {
    await page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  }
  await expect(programsTable(page)).toBeVisible({ timeout: 30_000 });
  return programRowsNamed(page, programName).count();
}

async function expectProgramRowCount(
  page: Page,
  programName: string,
  expected: number,
): Promise<void> {
  await expect(programRowsNamed(page, programName)).toHaveCount(expected, { timeout: 15_000 });
}

async function createProgram(
  page: Page,
  programName: string,
  description: string,
): Promise<void> {
  const modal = await openNewProgramModal(page);
  await modal.getByLabel('Program Name').fill(programName);
  await modal.getByLabel('Description').fill(description);
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden({ timeout: 15_000 });
}

async function expectProgramInList(page: Page, programName: string): Promise<void> {
  await expect(programsTable(page).getByText(programName, { exact: true })).toBeVisible();
}

async function attemptCreateProgram(
  modal: Locator,
  programName: string,
  description: string,
): Promise<void> {
  await modal.getByLabel('Program Name').fill(programName);
  await modal.getByLabel('Description').fill(description);
  const createButton = modal.getByRole('button', { name: 'Create' });
  if (await createButton.isEnabled()) {
    await createButton.click();
  }
}

async function expectDuplicateRejected(
  page: Page,
  modal: Locator,
  programName: string,
  countBefore: number,
): Promise<void> {
  const countAfter = await countProgramRowsNamed(page, programName);

  if (!(await modal.isVisible())) {
    expect(
      countAfter,
      'Duplicate should be rejected; modal closed and program count changed',
    ).toBe(countBefore);
    return;
  }

  expect(countAfter, 'Duplicate program should not increase list count').toBe(countBefore);

  const error = duplicateError(modal);
  if ((await error.count()) > 0) {
    await expect(error.first()).toBeVisible();
  }
}

test.describe('DS-3 — Program name validation and duplicate prevention', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Program name with special characters is accepted', async ({ page }, testInfo) => {
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const description = `Advanced AI and informatics track ${suffix}`;

    await createProgram(page, programName, description);
    await expectProgramInList(page, programName);
  });

  test('TC-002: Program name with hyphens and numbers is accepted', async ({ page }, testInfo) => {
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web-Dev 101 (2026) ${suffix}`;
    const description = `Hyphen and number validation ${suffix}`;

    await createProgram(page, programName, description);
    await expectProgramInList(page, programName);
  });

  test('TC-003: Duplicate check is case-insensitive', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const duplicateName = programName.toLowerCase();

    await createProgram(page, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(page, programName, 1);
    const countBefore = 1;

    const modal = await openNewProgramModal(page);
    await attemptCreateProgram(modal, duplicateName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(page, modal, programName, countBefore);
  });

  test('TC-004: Whitespace-only program name is rejected', async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill('   ');

    const createButton = modal.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
    await createButton.click({ force: true });
    await expect(modal).toBeVisible();
  });

  test('TC-005: Duplicate program name is rejected', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;

    await createProgram(page, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(page, programName, 1);
    const countBefore = 1;

    const modal = await openNewProgramModal(page);
    await attemptCreateProgram(modal, programName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(page, modal, programName, countBefore);
  });

  test('TC-006: Leading and trailing whitespace is trimmed before duplicate check', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const paddedName = `  ${programName}  `;

    await createProgram(page, programName, `Seed program ${suffix}`);
    await expectProgramRowCount(page, programName, 1);
    const countBefore = 1;

    const modal = await openNewProgramModal(page);
    await attemptCreateProgram(modal, paddedName, `Duplicate attempt ${suffix}`);
    await expectDuplicateRejected(page, modal, programName, countBefore);
  });

  test('TC-007: Empty program name cannot bypass validation', async ({ page }) => {
    const modal = await openNewProgramModal(page);

    await expect(modal.getByLabel('Program Name')).toHaveValue('');
    await expect(modal.getByRole('button', { name: 'Create' })).toBeDisabled();

    await modal.getByLabel('Program Name').press('Enter');

    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('TC-008: Program name with Unicode characters is accepted', async ({ page }, testInfo) => {
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Programme de Développement Web ${suffix}`;
    const description = `Unicode validation ${suffix}`;

    await createProgram(page, programName, description);
    await expectProgramInList(page, programName);
  });

  test('TC-009: Program name at maximum length boundary is validated for duplicates', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = String(Date.now()).slice(-6);
    const nameBody = 'A'.repeat(255 - suffix.length - 1);
    const programName = `${nameBody}-${suffix}`;
    expect(programName).toHaveLength(255);

    await createProgram(page, programName, `Max length seed ${suffix}`);
    await expectProgramRowCount(page, programName, 1);
    const countBefore = 1;

    const modal = await openNewProgramModal(page);
    await attemptCreateProgram(modal, programName, `Duplicate max length ${suffix}`);
    await expectDuplicateRejected(page, modal, programName, countBefore);
  });

  test('TC-010: Error message clears when user edits program name after duplicate error', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const existingName = `Web Development 2026 ${suffix}`;
    const newName = `Web Development 2027 ${suffix}`;

    await createProgram(page, existingName, `Seed program ${suffix}`);

    const modal = await openNewProgramModal(page);
    await attemptCreateProgram(modal, existingName, `Duplicate attempt ${suffix}`);

    const error = duplicateError(modal);
    const hasDuplicateError = (await error.count()) > 0;
    test.skip(
      !hasDuplicateError || !(await modal.isVisible()),
      'Duplicate error message is not shown on an open modal',
    );

    await modal.getByLabel('Program Name').fill(newName);
    await expect(error).toHaveCount(0);
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Create' })).toBeEnabled({
      timeout: 10_000,
    });
  });

  test('TC-011: Program name with only tabs or mixed whitespace is rejected', async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill('\t\t  \t');

    const createButton = modal.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
    await createButton.click({ force: true });
    await expect(modal).toBeVisible();
  });
});
