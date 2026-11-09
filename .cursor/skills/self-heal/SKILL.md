---
name: self-heal
description: >-
  Repairs Playwright locator drift after triage classifies a red run as a
  test issue. Use when the build is red because a locator broke, fix the
  drifted selector, the test broke after a UI change, or heal the suite —
  and ONLY after triage classifies the red run as a test issue (drift),
  never for a real app bug.
---

# Self-Heal

Repair one drifted locator in a POM after triage says the red run is a test issue. One repair per run; every heal becomes a PR.

## Steps

1. **Require triage's drift classification.** Proceed only when triage already classified the red run as a test issue (locator/selector drift). If there is no such classification, or triage called it a real app bug, **stop** and route to bug-reporter. Do not heal product defects.

2. **Find the failing locator and its POM.** From the Playwright trace / error, identify the exact locator that timed out or mismatched, and the `pages/` Page Object that owns it. Do not invent a new POM for a one-off heal.

3. **Re-discover the element via the Agent-Browser a11y tree.** Open the live UI (or the state captured at failure) and locate the element by its **role + current accessible name** in the accessibility tree. Prefer the name the UI exposes now — do not hard-code the old string if it drifted.

4. **Patch the locator in the POM only.** Minimal role-based diff (`getByRole` / label / placeholder per pom-conventions). Never edit the spec's assertions. Never weaken, delete, or rewrite `expect(...)` to go green.

5. **Re-run and prove green WITH assertions unchanged.** Run the affected spec and **record the local verification** under `test-results/self-heal/<ticket-or-spec-slug>/` (already gitignored via `/test-results/`):
   - `run.log` — full stdout/stderr of `npx playwright test <spec> -g "<title>"`
   - `playwright-report/` — HTML report from the same run (`PLAYWRIGHT_HTML_OUTPUT_DIR=test-results/self-heal/<slug>/playwright-report npx playwright test ... --reporter=list,html`)
   Green only counts if the same assertions still pass **and** those artifacts exist. Green via a weakened assertion is a bug — escalate (do not ship the heal; route to triage / bug-reporter as appropriate).

6. **Report.** Show the old → new locator diff, the POM file path, and paths to `test-results/self-heal/<slug>/run.log` + `playwright-report/` as evidence of the green run. Open a PR for this heal (one repair per run; every heal becomes a PR). Do not merge. Cite those paths in the PR body; do not commit `test-results/`.

## Rules

- One repair per run — do not batch unrelated locator fixes.
- Every heal becomes a PR; a human approves the merge.
- Never use `.disableRules()`, loosened expects, or deleted steps to go green.
- If re-discovery cannot find a role + accessible name match, stop and escalate instead of falling back to CSS/XPath.
