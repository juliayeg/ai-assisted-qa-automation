import { type Dialog, type Locator, type Page } from '@playwright/test';

import { EditProgramModal } from './EditProgramModal';
import { NewProgramModal } from './NewProgramModal';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

export const emptyStateMessage =
  /no programs have been created|no programs yet|haven't created any programs/i;
export const noMatchMessage =
  /no matching|no results|no programs match|nothing found|did not match/i;
export const createFirstProgramAction = /new program|create.*first program/i;

export class ProgramsPage {
  readonly page: Page;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;
  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly table: Locator;
  readonly emptyState: Locator;
  readonly noMatchState: Locator;
  readonly createFirstProgramButton: Locator;
  readonly anyEditButton: Locator;
  readonly dashboardNav: Locator;
  readonly programsNav: Locator;
  readonly dashboardHeading: Locator;
  readonly errorAlerts: Locator;
  readonly programFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
    this.heading = page.getByRole('heading', { name: 'Programs' });
    this.newProgramButton = page.getByRole('button', { name: 'New Program' });
    this.table = page.getByRole('table');
    this.emptyState = page.getByText(emptyStateMessage);
    this.noMatchState = page.getByText(noMatchMessage);
    this.createFirstProgramButton = page.getByRole('button', { name: createFirstProgramAction });
    this.anyEditButton = page.getByRole('button', { name: /^Edit / });
    this.dashboardNav = page.getByRole('button', { name: 'Dashboard' });
    this.programsNav = page.getByRole('button', { name: 'Programs' });
    this.dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
    this.errorAlerts = page.getByRole('alert');
    this.programFilter = page.getByRole('searchbox');
  }

  editProgramButton(programName: string): Locator {
    return this.page.getByRole('button', { name: `Edit ${programName}`, exact: true });
  }

  deleteProgramButton(programName: string): Locator {
    return this.page.getByRole('button', { name: `Delete ${programName}` });
  }

  programNameText(programName: string): Locator {
    return this.table.getByText(programName, { exact: true });
  }

  programRow(programName: string): Locator {
    return this.table.getByRole('row').filter({ hasText: programName });
  }

  programRowsNamed(programName: string): Locator {
    return this.programRow(programName);
  }

  programRowByEditButton(programName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.editProgramButton(programName) });
  }

  programNameCell(programName: string): Locator {
    return this.programRowByEditButton(programName)
      .getByRole('cell')
      .filter({ hasText: programName });
  }

  rowText(row: Locator, text: string, exact = false): Locator {
    return row.getByText(text, exact ? { exact: true } : undefined);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async tabUntilNewProgramButtonFocused(maxTabs = 40): Promise<void> {
    for (let i = 0; i < maxTabs; i += 1) {
      const focused = await this.newProgramButton.evaluate(
        (el) => el === document.activeElement,
      );
      if (focused) {
        return;
      }
      await this.page.keyboard.press('Tab');
    }
  }

  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  async openNewProgramForm(): Promise<void> {
    await this.newProgramButton.click();
  }

  async ensureOnProgramsPage(): Promise<void> {
    if (!this.page.url().includes('/programs')) {
      await this.goto();
    }
  }

  async fillAndSubmitNewProgram(programName: string, description?: string): Promise<void> {
    await this.ensureOnProgramsPage();
    await this.openNewProgramForm();
    await this.newProgramModal.programName.fill(programName);
    if (description !== undefined) {
      await this.newProgramModal.description.fill(description);
    }
    await this.newProgramModal.clickCreate();
  }

  async createProgram(programName: string, description?: string): Promise<void> {
    await this.fillAndSubmitNewProgram(programName, description);
  }

  async openEditProgram(programName: string): Promise<EditProgramModal> {
    await this.editProgramButton(programName).click();
    return this.editProgramModal;
  }

  async countProgramRowsNamed(programName: string): Promise<number> {
    await this.ensureOnProgramsPage();
    return this.programRowsNamed(programName).count();
  }

  waitForConfirmDialog(accept: boolean): Promise<Dialog> {
    return this.page.waitForEvent('dialog', { timeout: 15_000 }).then(async (dialog) => {
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
      return dialog;
    });
  }

  async clickDeleteWithDialog(programName: string, accept: boolean): Promise<Dialog> {
    const dialogPromise = this.waitForConfirmDialog(accept);
    await this.deleteProgramButton(programName).click();
    return dialogPromise;
  }

  errorAlertsMatching(text: RegExp): Locator {
    return this.errorAlerts.filter({ hasText: text });
  }

  async applyFilter(value: string): Promise<void> {
    await this.programFilter.fill(value);
  }

  async typeFilterIncrementally(values: readonly string[]): Promise<void> {
    for (const value of values) {
      await this.programFilter.fill(value);
    }
  }

  async dblclickDeleteProgram(programName: string): Promise<void> {
    await this.deleteProgramButton(programName).dblclick();
  }

  async clearFilter(): Promise<void> {
    await this.programFilter.fill('');
  }

  async navigateToDashboard(): Promise<void> {
    await this.dashboardNav.click();
  }

  async navigateToProgramsFromNav(): Promise<void> {
    await this.programsNav.click();
  }
}
