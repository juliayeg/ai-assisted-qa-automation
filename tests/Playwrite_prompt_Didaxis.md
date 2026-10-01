# Playwright automation prompt (Didaxis Studio)

Write Playwright tests for creating a new program on Didaxis Studio.

## App context (from manual inspection)

- Login page: [https://test.didaxis.studio/login](https://test.didaxis.studio/login)
  - Email field: `getByLabel('Email')`
  - Password field: `getByLabel('Password')`
  - Sign In button: `getByRole('button', { name: 'Sign In' })`
- Programs page: `/programs`
  - "New Program" button: `getByRole('button', { name: 'New Program' })`
  - Modal form:
    - Program Name: `getByLabel('Program Name')`
    - Description: `getByLabel('Description')`
    - Create button: `getByRole('button', { name: 'Create' })`

## Credentials

Use dotenv. Read email and password from `process.env`:

- `process.env.DIDAXIS_EMAIL`
- `process.env.DIDAXIS_PASSWORD`

Do NOT hardcode credentials in the test file.

## Requirements

- TypeScript
- Use Playwright MCP
- Use Playwright locators (`getByRole`, `getByLabel`, `getByText`); review locators, tests, and best practices
- Login as the first step in each test (or use `beforeEach`)
- Each test is independent
- Use unique test data with `Date.now()` suffix

## Test plans

Feature-specific plans live under [Test Cases](../Test%20Cases/) (e.g. [DS-4 — Delete program](../Test%20Cases/DS-4/DS-4_output.md)).

## Implementation notes (DS-4 delete)

- Spec file: `tests/ds4-delete-program.spec.ts`
- Delete action: `getByRole('button', { name: 'Delete {programName}' })`
- Confirmation: browser **native `confirm` dialog** (`page.on('dialog')` / `waitForEvent('dialog')`)
