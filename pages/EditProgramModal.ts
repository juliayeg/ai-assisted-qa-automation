import { type Locator, type Page } from '@playwright/test';

export class EditProgramModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly defaultSessionHours: Locator;
  readonly defaultExamHours: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Edit Program' });
    this.heading = this.dialog.getByRole('heading', { name: 'Edit Program' });
    this.programName = this.dialog.getByLabel('Program Name');
    this.description = this.dialog.getByLabel('Description');
    this.defaultSessionHours = this.dialog.getByLabel('Default Session Hours');
    this.defaultExamHours = this.dialog.getByLabel('Default Exam Hours');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }

  createButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Create' });
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  async pressEscapeFromProgramName(): Promise<void> {
    await this.programName.press('Escape');
  }
}
