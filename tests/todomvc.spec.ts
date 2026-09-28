import { test, expect } from '@playwright/test';
import { TodoMVCPage } from './pages/todomvc.page';

test.describe('TodoMVC — Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.gotoEmpty();
  });

  test('TC-001: New todo appears in the list after Enter', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.newTodo.click();
    await todoPage.addTodo('Buy groceries');

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await expect(todoPage.newTodo).toHaveValue('');
    await expect(todoPage.footer).toBeVisible();
    await todoPage.expectItemsLeft(1);
    await expect(todoPage.filterAll).toHaveClass(/selected/);
    await todoPage.expectTodoActive('Buy groceries');
  });

  test('TC-002: Completed todo is marked done and remaining count decreases', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');

    await todoPage.completeTodo('Buy groceries');

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await todoPage.expectTodoCompleted('Buy groceries');
    await todoPage.expectItemsLeft(0);
    await expect(todoPage.clearCompleted).toBeVisible();
  });

  test('TC-003: Todo is removed from the list after Delete', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');

    await todoPage.deleteTodo('Walk the dog');

    await expect(todoPage.todoTitle('Walk the dog')).toHaveCount(0);
    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await todoPage.expectItemsLeft(1);
  });

  test('TC-004: Multiple todos can be added in sequence', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');
    await todoPage.addTodo('Pay rent');

    await expect(todoPage.todoItems).toHaveCount(3);
    await expect(todoPage.todoItems.nth(0)).toContainText('Buy groceries');
    await expect(todoPage.todoItems.nth(1)).toContainText('Walk the dog');
    await expect(todoPage.todoItems.nth(2)).toContainText('Pay rent');
    await todoPage.expectItemsLeft(3);
    await expect(todoPage.newTodo).toBeFocused();
    await expect(todoPage.newTodo).toHaveValue('');
  });

  test('TC-005: Completed todo can be marked active again', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.completeTodo('Buy groceries');
    await todoPage.expectItemsLeft(0);

    await todoPage.completeTodo('Buy groceries');

    await todoPage.expectTodoActive('Buy groceries');
    await todoPage.expectItemsLeft(1);
    await expect(todoPage.clearCompleted).toBeHidden();
  });

  test('TC-006: Last remaining todo can be deleted and the list returns to empty state', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');

    await todoPage.deleteTodo('Buy groceries');

    await todoPage.expectEmptyList();
    await expect(todoPage.heading).toBeVisible();
    await expect(todoPage.newTodo).toBeVisible();
  });
});

test.describe('TodoMVC — Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.gotoEmpty();
  });

  test('TC-007: Empty input does not create a todo', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.newTodo.click();
    await todoPage.newTodo.press('Enter');

    await todoPage.expectEmptyList();
    await expect(todoPage.newTodo).toHaveValue('');
  });

  test('TC-008: Completing a todo does not remove it from the All list', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');
    await expect(todoPage.filterAll).toHaveClass(/selected/);

    await todoPage.completeTodo('Buy groceries');

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await expect(todoPage.todoTitle('Walk the dog')).toBeVisible();
    await todoPage.expectTodoCompleted('Buy groceries');
    await todoPage.expectTodoActive('Walk the dog');
  });

  test('TC-009: Deleting one todo does not delete or complete other todos', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');
    await todoPage.addTodo('Pay rent');

    await todoPage.deleteTodo('Walk the dog');

    await expect(todoPage.todoTitle('Walk the dog')).toHaveCount(0);
    await todoPage.expectTodoActive('Buy groceries');
    await todoPage.expectTodoActive('Pay rent');
    await todoPage.expectItemsLeft(2);
  });

  test('TC-010: Completing a todo does not change its title', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');

    await todoPage.completeTodo('Buy groceries');

    await expect(todoPage.todoTitle('Buy groceries')).toHaveText('Buy groceries');
  });

  test('TC-011: Todo is not created on blur without Enter', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.newTodo.click();
    await todoPage.newTodo.fill('Buy groceries');
    await todoPage.heading.click();

    await todoPage.expectEmptyList();
    await expect(todoPage.newTodo).toHaveValue('Buy groceries');
  });

  test('TC-012: Clicking the todo label does not complete or delete the item', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');

    await todoPage.todoTitle('Buy groceries').click();

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await todoPage.expectTodoActive('Buy groceries');
    await expect(todoPage.todoItems).toHaveCount(1);
  });
});

test.describe('TodoMVC — Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.gotoEmpty();
  });

  test('TC-013: Whitespace-only input does not create a todo', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.addTodo('   ');

    await todoPage.expectEmptyList();
  });

  test('TC-014: Leading and trailing spaces are trimmed from the saved title', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.addTodo('  Buy groceries  ');

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await todoPage.expectItemsLeft(1);
  });

  test('TC-015: Duplicate titles are allowed as separate items', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');

    await todoPage.addTodo('Buy groceries');

    await expect(todoPage.todoTitle('Buy groceries')).toHaveCount(2);
    await todoPage.expectItemsLeft(2);

    await todoPage.completeTodo('Buy groceries', 0);

    await expect(todoPage.todoTitle('Buy groceries')).toHaveCount(2);
    await expect(page.locator('[data-testid="todo-item"].completed')).toHaveCount(1);
    await todoPage.expectItemsLeft(1);
  });

  test('TC-016: Special characters are stored and displayed as literal text', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    const title = 'Buy milk & eggs <script>alert(1)</script> "now!"';
    let dialogShown = false;
    page.on('dialog', () => {
      dialogShown = true;
    });

    await todoPage.addTodo(title);

    await expect(todoPage.todoTitle(title)).toHaveText(title);
    expect(dialogShown).toBe(false);
    await todoPage.completeTodo(title);
    await todoPage.expectTodoCompleted(title);
    await todoPage.deleteTodo(title);
    await todoPage.expectEmptyList();
  });

  test('TC-017: Unicode and emoji titles are accepted', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    const title = 'Купить продукты 🛒';

    await todoPage.addTodo(title);

    await expect(todoPage.todoTitle(title)).toHaveText(title);
    await todoPage.expectItemsLeft(1);
    await todoPage.completeTodo(title);
    await todoPage.deleteTodo(title);
    await todoPage.expectEmptyList();
  });

  test('TC-018: Very long title is accepted because the field has no maxlength', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    const title = 'A'.repeat(500);

    await expect(todoPage.newTodo).not.toHaveAttribute('maxlength', /.+/);
    await todoPage.addTodo(title);

    await expect(todoPage.todoTitle(title)).toHaveText(title);
    await todoPage.completeTodo(title);
    await todoPage.deleteTodo(title);
    await todoPage.expectEmptyList();
  });

  test('TC-019: Single-character title is accepted', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);

    await todoPage.addTodo('A');

    await expect(todoPage.todoTitle('A')).toHaveText('A');
    await todoPage.expectItemsLeft(1);
  });

  test('TC-020: Completed item can still be deleted', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.completeTodo('Buy groceries');
    await expect(todoPage.clearCompleted).toBeVisible();

    await todoPage.deleteTodo('Buy groceries');

    await todoPage.expectEmptyList();
    await expect(todoPage.clearCompleted).toBeHidden();
  });

  test('TC-021: Mark all as complete checks every item without deleting them', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');

    await todoPage.markAllComplete.click();

    await expect(todoPage.todoItems).toHaveCount(2);
    await todoPage.expectTodoCompleted('Buy groceries');
    await todoPage.expectTodoCompleted('Walk the dog');
    await todoPage.expectItemsLeft(0);
    await expect(todoPage.clearCompleted).toBeVisible();
  });

  test('TC-022: Active filter hides completed items but does not delete them', async ({ page }) => {
    const todoPage = new TodoMVCPage(page);
    await todoPage.addTodo('Buy groceries');
    await todoPage.addTodo('Walk the dog');
    await todoPage.completeTodo('Buy groceries');

    await todoPage.filterActive.click();

    await expect(todoPage.todoTitle('Walk the dog')).toBeVisible();
    await expect(todoPage.todoTitle('Buy groceries')).toHaveCount(0);

    await todoPage.filterAll.click();

    await expect(todoPage.todoTitle('Buy groceries')).toBeVisible();
    await expect(todoPage.todoTitle('Walk the dog')).toBeVisible();
    await todoPage.expectTodoCompleted('Buy groceries');
  });
});
