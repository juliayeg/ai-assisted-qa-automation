import dotenv from 'dotenv';
import path from 'path';

import { test, expect, type Page, type Locator } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const saveTimeout = 60_000;

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  test.skip(!email || !password, 'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  return { email: email!, password: password! };
}

function newProgramModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

function editProgramButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Edit ${programName}`, exact: true });
}

function deleteProgramButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}`, exact: true });
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

async function goToProgramsPage(page: Page): Promise<void> {
  await page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Program' })).toBeVisible({
    timeout: 30_000,
  });
}

async function createProgram(
  page: Page,
  programName: string,
  description: string,
): Promise<void> {
  await page.getByRole('button', { name: 'New Program' }).click();
  const modal = newProgramModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  await modal.getByLabel('Program Name').fill(programName);
  await modal.getByLabel('Description').fill(description);
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden({ timeout: saveTimeout });
  await expect(editProgramButton(page, programName)).toBeVisible({ timeout: 30_000 });
}

async function openEditProgram(page: Page, programName: string): Promise<Locator> {
  await editProgramButton(page, programName).click();
  const modal = editProgramModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  return modal;
}

async function saveEdit(modal: Locator): Promise<void> {
  const saveButton = modal.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(modal).toBeHidden({ timeout: saveTimeout });
}

test.describe('DS-2 — Edit existing program details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Edit icon opens the Edit Program modal with current data', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Web Development 2026 ${suffix}`;
    const description = `Full-stack web development program ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, description);

    const modal = await openEditProgram(page, programName);

    await expect(modal.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(modal.getByLabel('Program Name')).toHaveValue(programName);
    await expect(modal.getByLabel('Description')).toHaveValue(description);
    await expect(modal.getByRole('button', { name: 'Save' })).toBeEnabled();
    await expect(modal.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Create' })).toHaveCount(0);
  });

  test('TC-002: Saving a new Program Name updates the list immediately', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const originalName = `Web Development 2026 ${suffix}`;
    const updatedName = `${originalName} - Updated`;
    const description = `Curriculum ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, originalName, description);

    const modal = await openEditProgram(page, originalName);
    await modal.getByLabel('Program Name').fill(updatedName);
    await saveEdit(modal);

    await expect(editProgramButton(page, updatedName)).toBeVisible({ timeout: 30_000 });
    await expect(deleteProgramButton(page, updatedName)).toBeVisible();
    await expect(editProgramButton(page, originalName)).toHaveCount(0);
    await expect(page.getByRole('row').filter({ has: editProgramButton(page, updatedName) })).toContainText(
      description,
    );
  });

  test('TC-003: Description-only edit leaves Program Name and other fields unchanged', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Preserve Fields ${suffix}`;
    const originalDescription = `Original description ${suffix}`;
    const updatedDescription = `Updated description ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, originalDescription);

    const firstEdit = await openEditProgram(page, programName);
    await expect(firstEdit.getByLabel('Program Name')).toHaveValue(programName);
    await expect(firstEdit.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(firstEdit.getByLabel('Default Exam Hours')).toHaveValue('3');
    await firstEdit.getByLabel('Description').fill(updatedDescription);
    await saveEdit(firstEdit);

    const reopened = await openEditProgram(page, programName);
    await expect(reopened.getByLabel('Program Name')).toHaveValue(programName);
    await expect(reopened.getByLabel('Description')).toHaveValue(updatedDescription);
    await expect(reopened.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(reopened.getByLabel('Default Exam Hours')).toHaveValue('3');
    await expect(editProgramButton(page, programName)).toBeVisible();
  });

  test('TC-004: Clearing Description is allowed and does not remove the program', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Clear Description ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Will be cleared ${suffix}`);

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Description').fill('');
    await saveEdit(modal);

    await expect(editProgramButton(page, programName)).toBeVisible();
    const reopened = await openEditProgram(page, programName);
    await expect(reopened.getByLabel('Description')).toHaveValue('');
    await expect(reopened.getByLabel('Program Name')).toHaveValue(programName);
  });

  test('TC-006: Save stays disabled when Program Name is empty', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const programName = `Empty Name Guard ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, 'Keep name required');

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Program Name').fill('');

    await expect(modal.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(modal).toBeVisible();
  });

  test('TC-007: Cancel discards unsaved edits', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Cancel Edit ${suffix}`;
    const description = `Original ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, description);

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Program Name').fill(`${programName} SHOULD NOT SAVE`);
    await modal.getByLabel('Description').fill('Cancel should discard this');
    await modal.getByRole('button', { name: 'Cancel' }).click();

    await expect(modal).toBeHidden();
    await expect(editProgramButton(page, programName)).toBeVisible();
    await expect(editProgramButton(page, `${programName} SHOULD NOT SAVE`)).toHaveCount(0);

    const reopened = await openEditProgram(page, programName);
    await expect(reopened.getByLabel('Program Name')).toHaveValue(programName);
    await expect(reopened.getByLabel('Description')).toHaveValue(description);
  });

  test('TC-008: Clicking the program name cell does not open the edit form', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programName = `Row Click ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, 'Clicking the name should not edit');

    const row = page.getByRole('row').filter({ has: editProgramButton(page, programName) });
    await row.getByRole('cell').first().click();

    await expect(editProgramModal(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/programs/);
  });

  test('TC-009: Whitespace-only Program Name keeps Save disabled', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programName = `Whitespace Name ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, 'Whitespace should not save');

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Program Name').fill('   ');

    await expect(modal.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('TC-010: Escape from Program Name closes modal without saving', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const programName = `Escape Edit ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, 'Escape discard');

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Program Name').fill(`${programName} ESC`);
    await modal.getByLabel('Program Name').press('Escape');

    await expect(modal).toBeHidden();
    await expect(editProgramButton(page, programName)).toBeVisible();
    await expect(editProgramButton(page, `${programName} ESC`)).toHaveCount(0);
  });

  test('TC-011: Modal X close discards unsaved edits', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const programName = `Close Icon ${suffix}`;
    const description = `Keep this ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, description);

    const modal = await openEditProgram(page, programName);
    await modal.getByLabel('Description').fill('X close should discard');
    await modal.locator('button.mantine-Modal-close').click();

    await expect(modal).toBeHidden();

    const reopened = await openEditProgram(page, programName);
    await expect(reopened.getByLabel('Description')).toHaveValue(description);
  });

  test('TC-012: Special characters in an edited name display correctly', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const originalName = `Special Name Seed ${suffix}`;
    const updatedName = `Informatique & IA - Niveau 2 ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, originalName, `Advanced AI track ${suffix}`);

    const modal = await openEditProgram(page, originalName);
    await modal.getByLabel('Program Name').fill(updatedName);
    await saveEdit(modal);

    await expect(editProgramButton(page, updatedName)).toBeVisible({ timeout: 30_000 });
    await expect(editProgramButton(page, originalName)).toHaveCount(0);
  });

  test('TC-013: Duplicate program name on edit should be rejected', async ({
    page,
  }, testInfo) => {
    test.fail(true, 'Known defect: edit accepts a name that already exists (DS-13 / DS-122)');
    test.setTimeout(180_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const firstName = `Alpha ${suffix}`;
    const secondName = `Beta ${suffix}`;

    await goToProgramsPage(page);
    await createProgram(page, firstName, `First ${suffix}`);
    await createProgram(page, secondName, `Second ${suffix}`);

    const modal = await openEditProgram(page, secondName);
    await modal.getByLabel('Program Name').fill(firstName);
    await modal.getByRole('button', { name: 'Save' }).click();

    await expect(modal).toBeVisible();
    await expect(editProgramButton(page, secondName)).toHaveCount(1);
    await expect(editProgramButton(page, firstName)).toHaveCount(1);
  });
});

test.describe('DS-2 — Edit existing program details (unauthenticated)', () => {
  test('TC-005: Unauthenticated users cannot open program edit', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${baseURL}/programs`);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveCount(0);
  });
});
