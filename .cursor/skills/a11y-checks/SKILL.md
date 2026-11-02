---
name: a11y-checks
description: Adds @axe-core/playwright accessibility scans and keyboard
  coverage when generating or reviewing Playwright tests for new pages or
  components. Apply whenever creating, extending, or reviewing UI tests —
  even if the user does not mention accessibility, a11y, or axe.
---

# Accessibility Checks

Add accessibility coverage for the programs page.
1. An axe scan: new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa'])
   .analyze(), asserted with expect(results.violations).toEqual([]).
   Scope with .include()/.exclude() only if a third-party widget is noisy, and comment why.
2. A keyboard test axe cannot do: tab to the primary control, assert
   toBeFocused(), press Enter, assert the dialog opens — role-based locators throughout.
Navigate through the existing POMs; no inline locators in the spec.
One tag per test.
If the scan finds real violations, report them and stop — never use .disableRules() to go green.

## When to apply

- Generate or extend a Playwright spec for a page, modal, drawer, or widget
- Review or refactor any UI test — even with no a11y mention
- Always for the Programs page (`tests/programs.a11y.spec.ts` or equivalent)

## Required axe pattern

```typescript
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();

await expect(results.violations).toEqual([]);
```

- Load the target UI via POMs; wait with web-first `expect` before scanning.
- Assert with `expect(results.violations).toEqual([])` — never bare `assert`,
  manual length checks, or `.disableRules()`.
- Scope with `.include()` / `.exclude()` **only** if a third-party widget is
  noisy, and comment why.

## Keyboard test (axe cannot do this)

1. Navigate via POM (`ProgramsPage.goto()`).
2. Tab to the primary control (e.g. `+ New Program`) using role-based POM locators.
3. `await expect(primaryControl).toBeFocused()`.
4. Press Enter; assert the dialog opens (`expect(modal.dialog).toBeVisible()`).

Role-based locators throughout. No inline locators in the spec.

## Programs page coverage

Keep both in `tests/programs.a11y.spec.ts` (or equivalent):

1. Axe scan of the Programs page with `withTags(['wcag2a','wcag2aa'])`.
2. Keyboard: tab → primary control focused → Enter → New Program dialog open.

**One tag per test.** Drive all interaction through existing POMs.

## Violations — report and stop

If the scan finds **real** violations, **report them and stop**. Never use
`.disableRules()` to go green. Let the test fail with
`expect(results.violations).toEqual([])` so the HTML report lists rule id,
impact, help URL, and affected nodes.

Hand off to **jira-bug-reporter** / the bug-reporter agent. Do not patch the
scan, disable rules, or re-run to manufacture a green result.

## File placement

- Dedicated: `tests/<feature>.a11y.spec.ts`
- Keep axe scans and keyboard asserts in specs, not POMs.

## Checklists

Generating:

- [ ] `AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()`
- [ ] `await expect(results.violations).toEqual([])`
- [ ] Keyboard path with `toBeFocused()` + Enter opens dialog
- [ ] POMs only; one tag per test
- [ ] Real violations reported; never `.disableRules()` to go green

Reviewing:

- [ ] Programs page (and new pages/components) have axe + keyboard coverage
- [ ] Tags are `wcag2a` / `wcag2aa`
- [ ] No `.disableRules()`
- [ ] `.include()`/`.exclude()` only for noisy third-party, with comment
- [ ] A11y failures on product UI → report and stop (jira-bug-reporter)
