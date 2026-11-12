# Suite reliability report

_Generated: 2026-11-12T01:02:08.481Z_  
_Trigger: `manual`_  


Cursor has no built-in telemetry for these metrics. This file is produced by [`scripts/eval-report.mjs`](scripts/eval-report.mjs) (CI, test-generation, or local orchestrator).

## Flake rate

| Metric | Value |
|--------|--------|
| Sample | Last **8** E2E workflow runs |
| Runs with ≥1 flaky test (passed only on retry) | **5/8 runs reported flaky tests (15 flaky test executions in sample)** |
| Flake rate (runs) | **62.5%** |

**How measured:** Parsed last 8 E2E workflow run logs via `gh run view --log`; counted Playwright summary "N flaky" lines (CI retries: 2).

**Interpretation:** Retries are hiding instability; investigate listed titles before trusting green smoke/sanity.

**Flaky titles (sample):**
- tests/ds2-display-program.spec.ts:233:9 › DS-2 — Edit existing program details › TC-013: Duplicate program name on edit should be rejected
- tests/ds3-program-name-validation.spec.ts:51:9 › DS-3 — Program name validation and duplicate prevention › TC-003: Duplicate check is case-insensitive
- tests/ds3-program-name-validation.spec.ts:68:9 › DS-3 — Program name validation and duplicate prevention › TC-004: Whitespace-only program name is rejected
- tests/manual/programs-bulk-delete.spec.ts:94:7 › Manual — programs bulk delete › GET programs and optionally DELETE by count or all
- tests/ds3-program-name-validation.spec.ts:78:9 › DS-3 — Program name validation and duplicate prevention › TC-005: Duplicate program name is rejected
- tests/programs.a11y.spec.ts:15:7 › Programs page accessibility › Programs page meets WCAG 2 A/AA (axe) @regression
- tests/ds2-display-program.spec.ts:91:9 › DS-2 — Edit existing program details › TC-004: Clearing Description is allowed and does not remove the program
- tests/ds271-program-name-validation.spec.ts:48:7 › DS-271 — Program name validation and duplicate prevention (Raya) › Reject duplicate program name
- tests/ds3-program-name-validation.spec.ts:94:9 › DS-3 — Program name validation and duplicate prevention › TC-006: Leading and trailing whitespace is trimmed before duplicate check
- tests/programs.a11y.spec.ts:67:9 › Programs page accessibility › DS-271 traceability › Programs page meets WCAG 2 A and AA via axe
- tests/ds271-program-name-validation.spec.ts:64:7 › DS-271 — Program name validation and duplicate prevention (Raya) › Reject case-variant duplicate program name


## Heal success rate

| Metric | Value |
|--------|--------|
| Drift heal attempts | **0** |
| Healed cleanly (green, assertions unchanged) | **0** |
| Success rate | **n/a (no drift heals recorded)** |
| Masked regressions (must be **0**) | **0** |

**How measured:** `.eval-state/heal-events.jsonl` (append on self-heal) + heuristic scan of PR titles/bodies mentioning heal/repair. Masked regression = events with `masked_regression: true` or weakened assertions in heal PRs.

**Interpretation:** No recorded masked regressions — self-heal stayed within POM-only policy.

## Generation-gate pass rate

| Metric | Value |
|--------|--------|
| DS ticket PRs sampled | **8** |
| First PR check green (E2E / Playwright) | **0** |
| Pass rate | **0.0%** |
| Hook blocks (generation + constitution) | **0** |

**How measured:** DS-* PR first E2E check success via `gh pr checks` + hook block counts in `.eval-state/generation-gate.jsonl` and `constitution-guard.jsonl` (populate from local hook audits). Conformance/AC mapping still requires human or agent review of `features/<KEY>.feature`.

**Interpretation:** Pass rate reflects CI green on first open PR, not full AC mapping audit. Hooks blocked **0** non-conforming edits when jsonl is populated.

## Ask vs guess

| Metric | Value |
|--------|--------|
| Agent asked (clarified) | **0** |
| Agent guessed (invented) | **0** |
| Ratio ask:guess | **n/a** |

**How measured:** Append-only `.eval-state/ask-guess.jsonl` — coordinator records `{"kind":"ask"|"guess","context":"..."}` after each orchestrator/agent session (Cursor has no built-in telemetry).

**Interpretation:** No session events logged yet — append to `.eval-state/ask-guess.jsonl` after orchestrator runs.

## Top reliability risk & next action

**Risk:** Playwright flakes under CI retries — smoke/sanity may pass while full regression stays noisy.

**Next action:** Triage flaky titles below; fix data isolation or web-first waits; re-run `npm run eval:report` after the next 5 E2E runs.

---

_Regenerate: `npm run eval:report` · After test-generation workflow · After local QA orchestrator (see `.cursor/rules/qa-orchestration.mdc`)._
