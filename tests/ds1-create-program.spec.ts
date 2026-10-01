import { test, expect, type Page, type Locator } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

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

async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireAdminCredentials();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function openNewProgramModal(page: Page): Promise<Locator> {
  await page.goto(`${baseURL}/programs`);
  await page.getByRole('button', { name: 'New Program' }).click();
  const modal = programFormModal(page);
  await expect(modal.getByLabel('Program Name')).toBeVisible();
  return modal;
}

async function submitNewProgram(modal: Locator): Promise<void> {
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden();
}

async function expectProgramInList(page: Page, programName: string): Promise<void> {
  await expect(programsTable(page).getByText(programName, { exact: true })).toBeVisible();
}

test.describe('DS-1 — Create new academic program', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Program creation form displays required fields', async ({ page }) => {
    await page.goto(`${baseURL}/programs`);
    await page.getByRole('button', { name: 'New Program' }).click();

    const modal = programFormModal(page);
    const programName = modal.getByLabel('Program Name');
    const description = modal.getByLabel('Description');

    await expect(programName).toBeVisible();
    await expect(description).toBeVisible();
    await expect(programName).toBeEditable();
    await expect(description).toBeEditable();
  });

  test('TC-002: New program appears in list after successful creation', async ({ page }) => {
    const suffix = Date.now();
    const programName = `Web Development 2026 ${suffix}`;
    const programDescription = `Full-stack web development program ${suffix}`;

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(programName);
    await modal.getByLabel('Description').fill(programDescription);
    await submitNewProgram(modal);

    await expectProgramInList(page, programName);
    await expect(programsTable(page).getByText(programDescription)).toBeVisible();
  });

  test('TC-003: Program is created with description only when name is provided', async ({ page }) => {
    const programName = `Data Science Fundamentals ${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(programName);
    await submitNewProgram(modal);

    await expectProgramInList(page, programName);
  });

  test('TC-004: Create button remains disabled when program name is empty', async ({ page }) => {
    const modal = await openNewProgramModal(page);

    await expect(modal.getByLabel('Program Name')).toHaveValue('');
    await expect(modal.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('TC-005: Program is not created when form is submitted with empty name', async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Description').fill(`Optional description only ${Date.now()}`);
    await expect(modal.getByRole('button', { name: 'Create' })).toBeDisabled();

    await modal.getByLabel('Program Name').press('Enter');

    await expect(modal).toBeVisible();
    await expect(modal.getByLabel('Program Name')).toHaveValue('');
    await expect(modal.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('TC-007: Program name at maximum allowed length is accepted', async ({ page }) => {
    const suffix = String(Date.now()).slice(-6);
    const nameBody = 'A'.repeat(255 - suffix.length - 1);
    const programName = `${nameBody}-${suffix}`;
    expect(programName).toHaveLength(255);

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(programName);
    await modal.getByLabel('Description').fill(`Boundary length test program ${Date.now()}`);
    await submitNewProgram(modal);

    await expectProgramInList(page, programName);
  });

  test('TC-008: Program name exceeding maximum length is rejected', async ({ page }) => {
    const longName = 'B'.repeat(256);

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(longName);

    const createButton = modal.getByRole('button', { name: 'Create' });
    const validationMessage = modal.getByText(/too long|maximum|max\.? \d+|characters/i);

    const createDisabled = await createButton.isDisabled();
    const hasValidation = await validationMessage.count();

    if (createDisabled) {
      await expect(createButton).toBeDisabled();
    } else if (hasValidation > 0) {
      await expect(validationMessage.first()).toBeVisible();
    } else {
      await createButton.click();
      await expect(modal.getByLabel('Program Name')).toBeVisible();
    }

    await expect(programsTable(page).getByText(longName, { exact: true })).toHaveCount(0);
  });

  test('TC-009: Modal closes without saving when Cancel is clicked', async ({ page }) => {
    const draftName = `Draft Program ${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(draftName);
    await modal.getByRole('button', { name: 'Cancel' }).click();

    await expect(modal).toBeHidden();
    await expect(programsTable(page).getByText(draftName)).toHaveCount(0);
  });

  test('TC-010: Description field accepts long text without breaking layout', async ({ page }) => {
    const suffix = Date.now();
    const programName = `Cloud Computing 2026 ${suffix}`;
    const longDescription = `Long description ${suffix} ${'x'.repeat(2000)}`;

    const modal = await openNewProgramModal(page);
    await modal.getByLabel('Program Name').fill(programName);
    await modal.getByLabel('Description').fill(longDescription);
    await submitNewProgram(modal);

    await expectProgramInList(page, programName);
  });
});

test.describe('DS-1 — Create new academic program (non-admin)', () => {
  test('TC-006: Non-admin user cannot access program creation', async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(!email || !password, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run this test');

    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto(`${baseURL}/programs`);
    const newProgramButton = page.getByRole('button', { name: 'New Program' });
    if (await newProgramButton.isVisible()) {
      await expect(newProgramButton).toBeDisabled();
    } else {
      await expect(newProgramButton).toBeHidden();
    }
  });
});
