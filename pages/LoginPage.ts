import { test, type Locator, type Page } from '@playwright/test';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseURL}/login`);
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.signInButton.click();
    await this.page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60_000 });
  }

  async signInFromEnv(): Promise<void> {
    const email = process.env.DIDAXIS_EMAIL;
    const password = process.env.DIDAXIS_PASSWORD;
    test.skip(!email || !password, 'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
    await this.signIn(email!, password!);
  }
}
