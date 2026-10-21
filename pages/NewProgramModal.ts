import { type Locator, type Page } from '@playwright/test';

export const duplicateNameError =
  /already exists|duplicate program|name is already in use|name must be unique/i;

export class NewProgramModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.heading = this.dialog.getByRole('heading', { name: 'New Program' });
    this.programName = this.dialog.getByLabel('Program Name');
    this.description = this.dialog.getByLabel('Description');
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  duplicateError(): Locator {
    return this.dialog.getByText(duplicateNameError);
  }

  async attemptCreate(programName: string, description: string): Promise<void> {
    await this.programName.fill(programName);
    await this.description.fill(description);
    if (await this.createButton.isEnabled()) {
      await this.createButton.click();
    }
  }

  async forceClickDisabledCreate(): Promise<void> {
    await this.createButton.click({ force: true });
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async dblclickCreate(): Promise<void> {
    await this.createButton.dblclick();
  }

  async submitProgramNameWithEnter(): Promise<void> {
    await this.programName.press('Enter');
  }
}
