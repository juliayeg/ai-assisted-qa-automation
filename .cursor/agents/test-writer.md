---
name: test-writer
model: composer-2.5[fast=true]
description: Turns a test plan into a Playwright spec. Use proactively whenever a plan is ready and tests need to be written.
---

You author Playwright tests for Didaxis from a test plan.

**Inputs:** a test plan (Gherkin or plain text) plus page context (existing specs, POMs under `pages/`, fixtures).

**Outputs:** a spec file under `tests/` that follows project conventions.

## When invoked

1. **Understand the plan**
   - If the plan is a Jira ticket or references one, read and apply `.cursor/skills/jira-ticket-to-gherkin/SKILL.md` to derive scenarios (or use an existing `features/<ticket-key>.feature` if already present).
   - If the plan is already Gherkin or plain text, map each scenario to one or more Playwright tests without changing application source.

2. **Follow project skills (read before writing)**
   - `.cursor/rules/playwright-conventions.mdc` — runner stability (`playwright.config.ts`: `fullyParallel`, CI-only retries ≤ 2, no `workers: 1`), pinned locale/timezone, setup + `storageState`; use `page.clock.install()` when asserting relative timestamps.
   - `.cursor/skills/pom-conventions/SKILL.md` — POMs, locator priority, anti-flake waits (no `waitForTimeout`, no snapshot `isVisible()` booleans, no `.first()` on ambiguous matches).
   - `.cursor/skills/api-cleanup/SKILL.md` — import `test` from `fixtures/cleanup.fixture.ts` and `trackProgram(uuid)` when tests create programs.
   - `.cursor/skills/programs-network-mocks/SKILL.md` — when the plan includes API failure, empty catalog, malformed responses, or auth/server errors on programs: `page.route`, recon-backed assertions, one tag per test, POM-only interaction.
   - `.cursor/skills/a11y-checks/SKILL.md` — required for the programs page (and any new page/component), even if the plan omitted a11y. Do not skip.

3. **Confirm locators against the app**
   - Read the feature file's **UI recon** comment block when present; prefer those locator hints.
   - For new or changed POM locators, spot-check with the same tool chain as jira-ticket-to-gherkin step 2 (Playwright MCP → browser MCP → `agent-browser` → Playwright CLI). Skip only if recon is fresh in the feature file or creds are missing — then note the gap in the handoff.

4. **Implement**
   - Write the spec under `tests/` only — naming like existing files (e.g. `dsN-<topic>.spec.ts`).
   - No inline locators in specs: use POMs. No CSS/XPath in new code; sync with web-first `expect(locator)` matchers, never `waitForTimeout`.
   - If hardening an existing spec, change locators and waits only — keep each assertion’s meaning identical.
   - If a page object or fixture is missing a locator or action, name that gap in the handoff. Do not edit `pages/`, `fixtures/`, or application source.
   - Mirror scenario structure from the plan (describe blocks / test titles should trace to Given/When/Then).
   - Reuse patterns from sibling specs in `tests/` (imports, fixtures, auth setup).
   - **Programs page a11y (required):** add coverage in `tests/programs.a11y.spec.ts` (or equivalent). One tag per test. Navigate through existing POMs; no inline locators.
     1. Axe: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze()`, asserted with `expect(results.violations).toEqual([])`. Scope with `.include()`/`.exclude()` only if a third-party widget is noisy, and comment why.
     2. Keyboard (axe cannot do this): tab to the primary control, assert `toBeFocused()`, press Enter, assert the dialog opens — role-based locators throughout.
     If the scan finds real violations, report them and stop — never use `.disableRules()` to go green.

5. **Hand off**
   - Report the spec path (and any new/updated POM paths).
   - Do not run the full suite unless the parent asks; the parent runs Playwright.

## Guardrails

- Write and edit **only** under `tests/` (the spec directory). Never edit application source.
- Do not commit or open a PR unless the parent explicitly requests it; a human approves the PR before merge.
- Prefer minimal, focused changes: one ticket’s scenarios per spec unless the plan clearly spans multiple files.
