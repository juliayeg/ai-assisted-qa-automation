# ai-assisted-qa-automation

Playwright end-to-end tests for Didaxis, with Cursor agents, skills, and hooks for plan → spec → triage → self-heal workflows.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (CI uses 20)
- Git

## Install

```bash
npm ci
npx playwright install chromium
```

## Environment

```bash
cp .env.example .env
```

Edit `.env` with your Didaxis credentials and URL. See [.env.example](.env.example) for two groups:

| Group | When you need it |
|-------|------------------|
| **Run tests** | Any local or CI Playwright run (`DIDAXIS_*`) |
| **Agent / CI setup** | GitHub workflow agents and Jira MCP (`CURSOR_*`, `ATLASSIAN_*`) |

Only the **Run tests** block is required for `npx playwright test`. Never commit `.env`.

## Run tests

Full suite (excludes `tests/manual/**` per `playwright.config.ts`):

```bash
npm test
# or
npx playwright test
```

Run a **tagged slice** (exactly one tag per test — see `.cursor/rules/constitution.mdc`):

```bash
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # --workers=1; shared-state maintenance in tests/manual/
```

Interactive / headed:

```bash
npm run test:ui
npm run test:headed
```

Maintenance scripts under `tests/manual/` use a separate config:

```bash
npm run test:programs
```

Auth is handled via the `setup` project and `playwright/.auth/user.json` (`storageState`); see `tests/auth.setup.ts`.

## CI

- **[E2E Tests](.github/workflows/e2e.yml)** — push/PR: `npx playwright test`; on failure, optional `self-heal` job (Cursor agent + repo secrets).
- **[Test generation](.github/workflows/test-generation.yml)** — scheduled backlog + mandatory suite self-heal (Cursor agent).

Store the same secret names as in `.env.example` under **Settings → Secrets and variables → Actions**.

## Cursor project setup (optional)

For AI-assisted test authoring and orchestration in the IDE:

| Path | Purpose |
|------|---------|
| [.cursor/rules/constitution.mdc](.cursor/rules/constitution.mdc) | Always-on MUST / SHOULD / WON'T |
| [.cursor/rules/qa-orchestration.mdc](.cursor/rules/qa-orchestration.mdc) | Ticket/backlog/red-run routing |
| [.cursor/rules/playwright-conventions.mdc](.cursor/rules/playwright-conventions.mdc) | POM, auth, cleanup, a11y detail |
| [.cursor/skills/](.cursor/skills/) | Workflows: Gherkin from Jira, self-heal, triage, POM, a11y, etc. |
| [.cursor/agents/](.cursor/agents/) | Subagents: `test-writer`, `triage`, `bug-reporter` |
| [.cursor/hooks.json](.cursor/hooks.json) | Post-edit guards (generation gate, constitution guard) |

**Atlassian MCP:** In Cursor **Settings → MCP**, connect the Atlassian server with your site; use `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` (and site URL) as documented there. Skills such as `jira-ticket-to-gherkin` and `jira-bug-reporter` expect Jira access.

**Headless CI agents** need `CURSOR_API_KEY` in GitHub secrets; local chat agents use your signed-in Cursor session.

## Conventions

New tests and POMs should follow the constitution and `playwright-conventions.mdc`. Hooks block common violations (e.g. `waitForTimeout`, weakened `expect`, XPath) on edits under `tests/**` and `pages/**`.
