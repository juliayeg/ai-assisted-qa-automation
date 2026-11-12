#!/usr/bin/env node
/**
 * Generate eval-report.md — suite reliability snapshot.
 * No Cursor telemetry; uses gh CLI (CI logs), git/PR history, and .eval-state/*.jsonl.
 *
 * Usage:
 *   node scripts/eval-report.mjs
 *   node scripts/eval-report.mjs --trigger test-generation --run-id 12345
 *   node scripts/eval-report.mjs --trigger local-orchestrator
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.eval-state');
const REPORT_PATH = path.join(ROOT, 'eval-report.md');
const DEFAULT_RUNS = Number(process.env.EVAL_CI_RUNS ?? 15);

function parseArgs(argv) {
  const out = { trigger: 'manual', runId: '', sessionNote: '' };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--trigger' && argv[i + 1]) {
      out.trigger = argv[++i];
    } else if (argv[i] === '--run-id' && argv[i + 1]) {
      out.runId = argv[++i];
    } else if (argv[i] === '--session-note' && argv[i + 1]) {
      out.sessionNote = argv[++i];
    }
  }
  return out;
}

function ghAvailable() {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ghJson(args) {
  try {
    const out = execFileSync('gh', args, { encoding: 'utf8', cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendJsonl(filePath, record) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function flakyFromRunLog(runId) {
  try {
    const log = execFileSync('gh', ['run', 'view', String(runId), '--log'], {
      encoding: 'utf8',
      cwd: ROOT,
      maxBuffer: 24 * 1024 * 1024,
    });
    const counts = [...log.matchAll(/\s(\d+) flaky\b/g)].map((m) => Number(m[1]));
    return counts.length > 0 ? Math.max(...counts) : 0;
  } catch {
    return null;
  }
}

function measureFlakeRate(runLimit) {
  if (!ghAvailable()) {
    return {
      runsSampled: 0,
      runsWithFlaky: 0,
      flakyTestsTotal: null,
      flakyTitles: [],
      method: 'gh CLI unavailable — install `gh` and authenticate, or set EVAL_CI_RUNS.',
    };
  }
  const runs =
    ghJson([
      'run',
      'list',
      '--workflow=e2e.yml',
      '--limit',
      String(runLimit),
      '--json',
      'databaseId,conclusion,createdAt,displayTitle,event',
    ]) ?? [];
  let runsWithFlaky = 0;
  let flakyTestsTotal = 0;
  const flakyTitles = new Set();

  for (const run of runs) {
    const n = flakyFromRunLog(run.databaseId);
    if (n === null) continue;
    if (n > 0) {
      runsWithFlaky += 1;
      flakyTestsTotal += n;
      try {
        const log = execFileSync('gh', ['run', 'view', String(run.databaseId), '--log'], {
          encoding: 'utf8',
          cwd: ROOT,
          maxBuffer: 24 * 1024 * 1024,
        });
        const flakyBlocks = log.match(/\d+ flaky[\s\S]*?(?=\n\s+\d+ failed|\n\s+passed|$)/g);
        if (flakyBlocks) {
          for (const block of flakyBlocks) {
            const titles = block.match(/› [^\n]+/g);
            if (titles) titles.forEach((t) => flakyTitles.add(t.replace(/^›\s*/, '').trim()));
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return {
    runsSampled: runs.length,
    runsWithFlaky,
    flakyTestsTotal,
    flakyTitles: [...flakyTitles].slice(0, 20),
    method: `Parsed last ${runs.length} E2E workflow run logs via \`gh run view --log\`; counted Playwright summary "N flaky" lines (CI retries: 2).`,
  };
}

function measureHealStats() {
  const events = readJsonl(path.join(STATE_DIR, 'heal-events.jsonl'));
  const driftAttempts = events.filter((e) => e.type === 'drift_heal_attempt');
  const clean = driftAttempts.filter((e) => e.outcome === 'green_unchanged_assertions');
  const masked = driftAttempts.filter((e) => e.masked_regression === true);

  let prHealTotal = 0;
  let prHealClean = 0;
  if (ghAvailable()) {
    const prs =
      ghJson(['pr', 'list', '--state', 'all', '--limit', '50', '--json', 'number,title,body,files']) ?? [];
    const healPrs = prs.filter(
      (p) => /heal|repair|self-heal|locator drift/i.test(`${p.title}\n${p.body ?? ''}`),
    );
    prHealTotal = healPrs.length;
    prHealClean = healPrs.filter((p) => !/weaken|delete.*expect|disableRules/i.test(p.body ?? '')).length;
  }

  const attempts = Math.max(driftAttempts.length, prHealTotal);
  const successes = Math.max(clean.length, prHealClean);

  return {
    attempts,
    successes,
    rate: attempts > 0 ? `${((successes / attempts) * 100).toFixed(1)}%` : 'n/a (no drift heals recorded)',
    maskedRegression: masked.length,
    method:
      '`.eval-state/heal-events.jsonl` (append on self-heal) + heuristic scan of PR titles/bodies mentioning heal/repair. Masked regression = events with `masked_regression: true` or weakened assertions in heal PRs.',
  };
}

function measureGenerationGate() {
  const hookBlocks = readJsonl(path.join(STATE_DIR, 'generation-gate.jsonl'));
  const constitutionBlocks = readJsonl(path.join(STATE_DIR, 'constitution-guard.jsonl'));
  const blocked = hookBlocks.length + constitutionBlocks.length;

  let ticketPrs = [];
  let firstGreen = 0;
  if (ghAvailable()) {
    ticketPrs =
      ghJson([
        'pr',
        'list',
        '--state',
        'all',
        '--limit',
        '30',
        '--json',
        'number,title,body',
      ])?.filter((p) => /\bDS-\d+/i.test(p.title)) ?? [];

    for (const pr of ticketPrs) {
      const checks = ghJson(['pr', 'checks', String(pr.number), '--json', 'name,state,bucket']);
      if (!checks || checks.length === 0) continue;
      const e2e = checks.filter((c) => /e2e|playwright|test/i.test(c.name));
      const green = (c) =>
        c.bucket === 'pass' || c.state === 'SUCCESS' || c.state === 'COMPLETED' || c.conclusion === 'SUCCESS';
      if (e2e.length > 0 && e2e.every(green)) firstGreen += 1;
    }
  }

  const total = ticketPrs.length;
  const passRate = total > 0 ? `${((firstGreen / total) * 100).toFixed(1)}%` : 'n/a';

  return {
    ticketPrs: total,
    firstPrGreen: firstGreen,
    passRate,
    hookBlocks: blocked,
    method:
      'DS-* PR first E2E check success via `gh pr checks` + hook block counts in `.eval-state/generation-gate.jsonl` and `constitution-guard.jsonl` (populate from local hook audits). Conformance/AC mapping still requires human or agent review of `features/<KEY>.feature`.',
  };
}

function measureAskVsGuess() {
  const rows = readJsonl(path.join(STATE_DIR, 'ask-guess.jsonl'));
  const asks = rows.filter((r) => r.kind === 'ask').length;
  const guesses = rows.filter((r) => r.kind === 'guess').length;
  return {
    asks,
    guesses,
    ratio: asks + guesses > 0 ? `${asks}:${guesses}` : 'n/a',
    method:
      'Append-only `.eval-state/ask-guess.jsonl` — coordinator records `{"kind":"ask"|"guess","context":"..."}` after each orchestrator/agent session (Cursor has no built-in telemetry).',
  };
}

function inferRisk(flake, heal, gate, askGuess) {
  if (flake.runsWithFlaky > 0 && flake.runsSampled > 0) {
    return {
      risk: 'Playwright flakes under CI retries — smoke/sanity may pass while full regression stays noisy.',
      action: 'Triage flaky titles below; fix data isolation or web-first waits; re-run `npm run eval:report` after the next 5 E2E runs.',
    };
  }
  if (heal.maskedRegression > 0) {
    return {
      risk: 'Self-heal may have masked regressions (assertions weakened).',
      action: 'Stop merges; review heal PRs and constitution-guard blocks; set `masked_regression` events to zero.',
    };
  }
  if (askGuess.guesses > askGuess.asks && askGuess.guesses > 0) {
    return {
      risk: 'Agent invents values more often than it asks — Gherkin/AC drift risk.',
      action: 'Require Jira/AC lookup before test-writer; log asks in `.eval-state/ask-guess.jsonl`.',
    };
  }
  return {
    risk: 'CI stability unknown or env/credential failures dominate (check latest E2E conclusion).',
    action: 'Run full regression on demand; ensure secrets; append heal and ask/guess events during orchestrator runs.',
  };
}

function buildReport({ trigger, runId, sessionNote }) {
  const generatedAt = new Date().toISOString();
  const flake = measureFlakeRate(DEFAULT_RUNS);
  const heal = measureHealStats();
  const gate = measureGenerationGate();
  const askGuess = measureAskVsGuess();
  const { risk, action } = inferRisk(flake, heal, gate, askGuess);

  const flakeRate =
    flake.runsSampled > 0
      ? `${flake.runsWithFlaky}/${flake.runsSampled} runs reported flaky tests (${flake.flakyTestsTotal ?? '—'} flaky test executions in sample)`
      : 'unavailable';

  return `# Suite reliability report

_Generated: ${generatedAt}_  
_Trigger: \`${trigger}\`${runId ? ` · run \`${runId}\`` : ''}_  
${sessionNote ? `_Note: ${sessionNote}_\n` : ''}

Cursor has no built-in telemetry for these metrics. This file is produced by [\`scripts/eval-report.mjs\`](scripts/eval-report.mjs) (CI, test-generation, or local orchestrator).

## Flake rate

| Metric | Value |
|--------|--------|
| Sample | Last **${flake.runsSampled || DEFAULT_RUNS}** E2E workflow runs |
| Runs with ≥1 flaky test (passed only on retry) | **${flakeRate}** |
| Flake rate (runs) | **${flake.runsSampled ? `${((flake.runsWithFlaky / flake.runsSampled) * 100).toFixed(1)}%` : 'n/a'}** |

**How measured:** ${flake.method}

**Interpretation:** ${flake.runsWithFlaky > 0 ? 'Retries are hiding instability; investigate listed titles before trusting green smoke/sanity.' : flake.runsSampled > 0 ? 'No flaky markers in the sampled logs — good sign for retry-gated CI.' : 'Could not sample CI; run locally with `gh auth login`.'}

${flake.flakyTitles.length > 0 ? `**Flaky titles (sample):**\n${flake.flakyTitles.map((t) => `- ${t}`).join('\n')}\n` : ''}

## Heal success rate

| Metric | Value |
|--------|--------|
| Drift heal attempts | **${heal.attempts}** |
| Healed cleanly (green, assertions unchanged) | **${heal.successes}** |
| Success rate | **${heal.rate}** |
| Masked regressions (must be **0**) | **${heal.maskedRegression}** |

**How measured:** ${heal.method}

**Interpretation:** ${heal.maskedRegression === 0 ? 'No recorded masked regressions — self-heal stayed within POM-only policy.' : '**Stop:** masked regression count must be zero; review heal PRs immediately.'}

## Generation-gate pass rate

| Metric | Value |
|--------|--------|
| DS ticket PRs sampled | **${gate.ticketPrs}** |
| First PR check green (E2E / Playwright) | **${gate.firstPrGreen}** |
| Pass rate | **${gate.passRate}** |
| Hook blocks (generation + constitution) | **${gate.hookBlocks}** |

**How measured:** ${gate.method}

**Interpretation:** ${gate.ticketPrs > 0 ? 'Pass rate reflects CI green on first open PR, not full AC mapping audit.' : 'No DS PRs in sample — backlog generation may not have opened PRs yet.'} Hooks blocked **${gate.hookBlocks}** non-conforming edits when jsonl is populated.

## Ask vs guess

| Metric | Value |
|--------|--------|
| Agent asked (clarified) | **${askGuess.asks}** |
| Agent guessed (invented) | **${askGuess.guesses}** |
| Ratio ask:guess | **${askGuess.ratio}** |

**How measured:** ${askGuess.method}

**Interpretation:** ${askGuess.asks + askGuess.guesses === 0 ? 'No session events logged yet — append to `.eval-state/ask-guess.jsonl` after orchestrator runs.' : askGuess.asks >= askGuess.guesses ? 'More asks than guesses — safer for AC alignment.' : 'Guesses dominate — tighten orchestrator to query Jira/UI before writing specs.'}

## Top reliability risk & next action

**Risk:** ${risk}

**Next action:** ${action}

---

_Regenerate: \`npm run eval:report\` · After test-generation workflow · After local QA orchestrator (see \`.cursor/rules/qa-orchestration.mdc\`)._
`;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.trigger === 'local-orchestrator' && args.sessionNote) {
    appendJsonl(path.join(STATE_DIR, 'ask-guess.jsonl'), {
      ts: new Date().toISOString(),
      kind: 'ask',
      context: `orchestrator session end: ${args.sessionNote}`,
    });
  }

  const md = buildReport(args);
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main();
