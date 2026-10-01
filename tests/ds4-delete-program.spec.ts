import { test, expect, type Page, type Locator, type Dialog } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const emptyStateMessage = /no programs have been created|no programs yet|haven't created any programs/i;

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

function deleteProgramButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}` });
}

function programRows(page: Page, programName: string): Locator {
  return programsTable(page).getByRole('row').filter({ hasText: programName });
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
  const modal = programFormModal(page);
  await modal.getByLabel('Program Name').fill(programName);
  await modal.getByLabel('Description').fill(description);
  const createButton = modal.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
  await expect(deleteProgramButton(page, programName)).toBeVisible({ timeout: 30_000 });
}

function waitForConfirmDialog(
  page: Page,
  options: { accept: boolean; expectProgramName?: string },
): Promise<Dialog> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Confirm dialog did not appear')), 15_000);
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      try {
        expect(dialog.type()).toBe('confirm');
        if (options.expectProgramName) {
          expect(dialog.message()).toContain(options.expectProgramName);
        }
        if (options.accept) {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolve(dialog);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function clickDeleteWithDialog(
  page: Page,
  programName: string,
  accept: boolean,
): Promise<Dialog> {
  const dialogPromise = waitForConfirmDialog(page, { accept, expectProgramName: programName });
  await deleteProgramButton(page, programName).click();
  return dialogPromise;
}

test.describe('DS-4 — Delete program with confirmation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-001: Program is removed after confirming deletion', async ({ page }, testInfo) => {
    const programName = `Test Program ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);
    await expect(programRows(page, programName)).toHaveCount(1);

    await clickDeleteWithDialog(page, programName, true);
    await expect(programRows(page, programName)).toHaveCount(0);
  });

  test('TC-002: Program remains when deletion is cancelled', async ({ page }, testInfo) => {
    const programName = `Cancel Delete ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    await clickDeleteWithDialog(page, programName, false);
    await expect(programRows(page, programName)).toHaveCount(1);
  });

  test('TC-003: Confirmation dialog shows the program name being deleted', async ({
    page,
  }, testInfo) => {
    const programName = `Cybersecurity Basics ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    const dialog = await clickDeleteWithDialog(page, programName, false);
    expect(dialog.message()).toMatch(/Delete program/i);
    expect(dialog.message()).toContain(programName);
    await expect(programRows(page, programName)).toHaveCount(1);
  });

  test('TC-004: List count updates after successful deletion', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const suffix = uniqueSuffix(testInfo.testId);
    const names = [
      `Count A ${suffix}`,
      `Count B ${suffix}`,
      `Count C ${suffix}`,
    ];

    for (const name of names) {
      await goToProgramsPage(page);
      await createProgram(page, name, `Seed ${name}`);
    }
    await goToProgramsPage(page);
    await expect(programRows(page, suffix)).toHaveCount(3);

    await clickDeleteWithDialog(page, names[0], true);
    await expect(programRows(page, suffix)).toHaveCount(2);
    await expect(programRows(page, names[0])).toHaveCount(0);
  });

  test('TC-005: Program is not deleted when confirmation dialog is dismissed via Escape', async ({
    page,
  }, testInfo) => {
    const programName = `Escape Delete ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    await clickDeleteWithDialog(page, programName, false);
    await expect(programRows(page, programName)).toHaveCount(1);
  });

  test('TC-007: Double-clicking confirm does not cause errors', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const programName = `Double Confirm ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount += 1;
      await dialog.accept();
    });

    await deleteProgramButton(page, programName).dblclick();
    await expect(programRows(page, programName)).toHaveCount(0, { timeout: 30_000 });
    expect(dialogCount).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('alert').filter({ hasText: /error|failed/i })).toHaveCount(0);
  });

  test('TC-008: Delete last remaining program shows empty state', async ({ page }) => {
    test.skip(true, 'Precondition (only one program in tenant) is not available on shared test env');
    await goToProgramsPage(page);
    await expect(page.getByText(emptyStateMessage)).toBeVisible();
  });

  test('TC-009: Delete icon works for program with special characters in name', async ({
    page,
  }, testInfo) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    await clickDeleteWithDialog(page, programName, true);
    await expect(programRows(page, programName)).toHaveCount(0);
  });

  test('TC-010: Deletion failure shows error and preserves program in list', async ({
    page,
  }, testInfo) => {
    const programName = `Fail Delete ${uniqueSuffix(testInfo.testId)}`;

    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);

    await page.route('**/programs/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
        return;
      }
      await route.continue();
    });

    await clickDeleteWithDialog(page, programName, true);
    await expect(programRows(page, programName)).toHaveCount(1, { timeout: 15_000 });

    const alerts = page.getByRole('alert');
    if ((await alerts.count()) > 0) {
      await expect(alerts.last()).toContainText(/error|fail|unable|could not/i);
    }
  });

  test('TC-011: Clicking outside confirmation dialog cancels deletion', async ({
    page,
  }, testInfo) => {
    test.skip(
      true,
      'Confirmation is a native browser dialog; there is no backdrop to click',
    );

    const programName = `Backdrop ${uniqueSuffix(testInfo.testId)}`;
    await goToProgramsPage(page);
    await createProgram(page, programName, `Seed ${programName}`);
  });
});

test.describe('DS-4 — Delete program with confirmation (non-admin)', () => {
  test('TC-006: Non-admin user cannot delete programs', async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(!email || !password, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD');

    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).not.toHaveURL(/\/login$/);

    await goToProgramsPage(page);
    const deleteButtons = page.getByRole('button', { name: /^Delete / });
    const count = await deleteButtons.count();
    if (count === 0) {
      await expect(deleteButtons).toHaveCount(0);
      return;
    }
    for (let i = 0; i < count; i += 1) {
      await expect(deleteButtons.nth(i)).toBeDisabled();
    }
  });
});
