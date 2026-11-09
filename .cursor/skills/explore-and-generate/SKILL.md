---
name: explore-and-generate
description: >
  Finds the highest-value user flow the suite does not cover and writes one
  Gherkin test plan for the test-writer. Use the moment someone says "find
  what we're not testing", "explore <page> for untested flows", or "expand
  coverage", or asks which flows on a page lack tests. Do NOT use it when a
  ticket already exists (that's jira-ticket-analyzer; this is for when
  there's no ticket).
---

# Explore and Generate

Read-only exploration. Find one untested user flow and hand a Gherkin plan
to the test-writer. Do not implement the spec.

If the user names a Jira ticket, stop. That work belongs to
jira-ticket-analyzer.

## Steps

1. Map covered flows by reading `tests/`. Note the page, the action, and
   what each spec already asserts. Read matching files in `pages/` only to
   see which entry points exist.

2. Crawl the target via the Playwright MCP and read the a11y tree, not
   pixels. Base URL is `DIDAXIS_URL` or `https://test.didaxis.studio`.
   Sign in at `/login` with `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` from
   `.env`. Never hardcode credentials. If either variable is missing, stop
   and say recon was skipped. Do not screenshot. Do not submit creates,
   edits, or deletes. Open dialogs and read accessible names, roles,
   labels, enabled state, and routes, then leave the data as you found it.

3. Enumerate real user flows the UI supports. A flow is a path a user can
   finish from the controls in the a11y tree (open, fill, submit, cancel,
   filter, navigate). Skip controls you did not see.

4. Diff to find the coverage gap. A flow is uncovered when no spec in
   `tests/` walks that path and asserts its outcome.

5. Pick the highest-value uncovered flow with a reason, one per run. Prefer
   a flow that changes or guards user data over a cosmetic one. State the
   reason in one sentence. Stop after that one flow.

6. Output a Gherkin test plan (positive path + one edge case, every Then
   assertable) for the test-writer to implement.

## Output

Save `features/explore-<area>-<flow>.feature`. Do not edit application
source, `tests/`, `pages/`, or `fixtures/`.

```gherkin
Feature: <area> — <flow>
  As a signed-in user, I want <outcome>
  so that <why it matters>.

  # Why this flow
  # <one sentence: highest-value uncovered flow, and why>

  # Happy path

  Scenario: <observable success>
    Given I am signed in on the <Page> page
    When I <action the a11y tree showed>
    Then <visible outcome a Playwright expect can check>
    And <second observable outcome>

  # Edge case

  Scenario: <one boundary the same flow exposes>
    Given I am signed in on the <Page> page
    When I <boundary action>
    Then <observable refusal or alternate outcome>

  # UI recon
  # - Tool: Playwright MCP (a11y tree)
  # - Date: <YYYY-MM-DD>
  # - Base URL: <url>
  # - Paths: <routes walked>
  # - Locator hints: <role / accessible name / label for each control>
  # - Covered already: <spec files that neighbor this flow>
  # - Not picked this run: <other gaps, names only>
```

Every `Then` names something on screen or in the URL: visible text, a
role, enabled or disabled, a dialog open or closed, a row present or
absent, or the current path. Do not write "works", "handles", or "is
correct".
