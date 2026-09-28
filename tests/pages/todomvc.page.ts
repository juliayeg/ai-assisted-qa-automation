import { type Locator, type Page, expect } from '@playwright/test';

export const TODOMVC_URL = 'https://demo.playwright.dev/todomvc/#/';

export class TodoMVCPage {
  readonly page: Page;
  readonly newTodo: Locator;
  readonly heading: Locator;
  readonly todoItems: Locator;
  readonly todoCount: Locator;
  readonly footer: Locator;
  readonly markAllComplete: Locator;
  readonly clearCompleted: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodo = page.getByPlaceholder('What needs to be done?');
    this.heading = page.getByRole('heading', { name: 'todos' });
    this.todoItems = page.getByTestId('todo-item');
    this.todoCount = page.getByTestId('todo-count');
    this.footer = page.locator('.footer');
    this.markAllComplete = page.getByLabel('Mark all as complete');
    this.clearCompleted = page.getByRole('button', { name: 'Clear completed' });
    this.filterAll = page.getByRole('link', { name: 'All' });
    this.filterActive = page.getByRole('link', { name: 'Active' });
    this.filterCompleted = page.getByRole('link', { name: 'Completed' });
  }

  async gotoEmpty(): Promise<void> {
    await this.page.goto(TODOMVC_URL);
    await this.page.evaluate(() => localStorage.removeItem('react-todos'));
    await this.page.reload();
    await expect(this.newTodo).toBeVisible();
    await expect(this.todoItems).toHaveCount(0);
  }

  async addTodo(title: string): Promise<void> {
    await this.newTodo.fill(title);
    await this.newTodo.press('Enter');
  }

  todoItem(title: string): Locator {
    return this.todoItems.filter({ has: this.page.getByTestId('todo-title').getByText(title, { exact: true }) });
  }

  todoToggle(title: string): Locator {
    return this.todoItem(title).getByRole('checkbox', { name: 'Toggle Todo' });
  }

  todoTitle(title: string): Locator {
    return this.todoItem(title).getByTestId('todo-title');
  }

  async deleteTodo(title: string): Promise<void> {
    const item = this.todoItem(title);
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async completeTodo(title: string, index = 0): Promise<void> {
    await this.todoItem(title).nth(index).getByRole('checkbox', { name: 'Toggle Todo' }).click();
  }

  async expectItemsLeft(count: number): Promise<void> {
    const label = count === 1 ? '1 item left' : `${count} items left`;
    await expect(this.todoCount).toHaveText(label);
  }

  async expectEmptyList(): Promise<void> {
    await expect(this.todoItems).toHaveCount(0);
    await expect(this.footer).toBeHidden();
  }

  async expectTodoActive(title: string): Promise<void> {
    const item = this.todoItem(title);
    await expect(item).not.toHaveClass(/completed/);
    await expect(this.todoToggle(title)).not.toBeChecked();
  }

  async expectTodoCompleted(title: string): Promise<void> {
    const item = this.todoItem(title);
    await expect(item).toHaveClass(/completed/);
    await expect(this.todoToggle(title)).toBeChecked();
  }
}
