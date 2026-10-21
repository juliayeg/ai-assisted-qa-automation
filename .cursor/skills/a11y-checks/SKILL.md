---
name: a11y-checks
description: Adds @axe-core/playwright accessibility scans and keyboard
  coverage when generating or reviewing Playwright tests for new pages or
  components. Apply whenever creating, extending, or reviewing UI tests —
  even if the user does not mention accessibility, a11y, or axe.
---

# Accessibility Checks

Every Playwright test for a new page or component **must** include axe-core
coverage plus a keyboard path axe cannot cover. This does not require the
user to ask. Prefer dedicated specs under `tests/<feature>.a11y.spec.ts`
(see programs page below).

## When to apply

- Generate or extend a Playwright spec for a page, modal, drawer, or widget
- Review or refactor any UI test — even with no a11y mention

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
- Assert with `expect(results.violations).toEqual([])` — never bare `assert`
  or manual length checks.
- Scope with `.include()` / `.exclude()` **only** if a third-party widget is
  noisy, and comment why. Prefer full-page scans for page-level coverage;
  for a modal/component under test, `.include()` from a role-based POM helper
  (e.g. `NewProgramModal.axeIncludeSelector()`) is fine.

## Keyboard test (axe cannot do this)

For the programs page (and other primary CTAs):

1. Navigate via POM (`ProgramsPage.goto()`).
2. Tab to the primary control (e.g. `+ New Program`) using role-based POM locators.
3. `await expect(primaryControl).toBeFocused()`.
4. Press Enter; assert the dialog opens (`expect(modal.dialog).toBeVisible()`).

Role-based locators throughout. No inline locators in the spec.

## Programs page coverage

Add (or keep) both in `tests/programs.a11y.spec.ts` (or equivalent):

1. Axe scan of the Programs page with `withTags(['wcag2a','wcag2aa'])`.
2. Keyboard: tab → primary control focused → Enter → New Program dialog open.

**One tag per test.** Drive all interaction through existing POMs.

## Violations — never silence to go green

If axe finds **real** violations, **DO NOT** disable rules to go green —
**record them** (they may be a product bug for the **jira-bug-reporter**
skill). Let the test **fail** with `expect(results.violations).toEqual([])`
so the HTML report and assertion message list rule id, impact, help URL, and
affected nodes.

Use `fixtures/a11y-expect.ts` (`expectNoAxeViolations`) — it attaches a
readable violation summary to the assertion message on failure.

After an a11y failure on app UI (not env/auth), run **jira-bug-reporter**:
treat each distinct rule/area as a defect candidate unless a duplicate Bug
already exists.

### `.disableRules()` — rare exception only

**Never** use `.disableRules()` to mask real WCAG failures on Didaxis UI.

Only chain `.disableRules('rule-id')` when **all** of the following are true:

1. The violation is a **known false positive** or **third-party widget** you
   cannot fix in this repo.
2. There is an **inline comment on the same line or the line above** stating
   why that rule is disabled (owner, ticket, or external component).
3. The scan still asserts all **other** rules via `withTags` / normal analyze.

```typescript
// Third-party chat embed; contrast owned by vendor (EXT-42). Not app UI.
.disableRules("color-contrast")
```

If unsure, do **not** disable — record the violation and file a Bug.

## File placement

- Dedicated: `tests/<feature>.a11y.spec.ts`
- Or an axe assertion at the end of a functional test that already reaches the UI

Keep axe scans and keyboard asserts in specs, not POMs. POMs may expose
`axeIncludeSelector()` helpers only.

## Checklists

Generating:

- [ ] `AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()`
- [ ] `await expect(results.violations).toEqual([])`
- [ ] Keyboard path with `toBeFocused()` + Enter opens dialog (where applicable)
- [ ] POMs only; one tag per test
- [ ] Failures record violations (message/report), not hidden with disableRules
- [ ] Any `.disableRules()` has a comment explaining why (never to pass real bugs)

Reviewing:

- [ ] New page/component has axe + keyboard coverage
- [ ] Tags are `wcag2a` / `wcag2aa`
- [ ] No `.disableRules()` used to pass real app violations
- [ ] Any `.disableRules()` has a documented reason (false positive / third-party)
- [ ] `.include()`/`.exclude()` only for noisy third-party, with comment
- [ ] A11y failures on product UI → consider jira-bug-reporter
