#!/usr/bin/env node
/**
 * Constitution guard for tests/** and pages/**.
 *
 * afterFileEdit matchers match tool name "Write", not paths — filter in-script.
 * Blocks (exit 2) edits that introduce constitution WON'T violations.
 */
'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

const HOOK_PATH_RE = /^(tests|pages)\/.+\.(?:[cm]?[jt]sx?)$/i;
const SPEC_RE = /^tests\/.+\.(?:spec|test)\.(?:[cm]?[jt]sx?)$/i;

const WONT_CHECKS = [
  {
    id: 'waitForTimeout',
    label: 'page.waitForTimeout / waitForTimeout',
    re: /\bwaitForTimeout\s*\(/g,
  },
  {
    id: 'xpath',
    label: 'XPath locator',
    re: /(?:xpath\s*=\s*|locator\s*\(\s*['"`]\/\/)|\bpage\.locator\s*\(\s*['"`]\/\//gi,
  },
  {
    id: 'any',
    label: 'the any type',
    re: /:\s*any\b|as\s+any\b/g,
  },
  {
    id: 'describe-tag',
    label: 'tag on test.describe()',
    re: /test\.describe\s*\(\s*\{[^)]*\btag\s*:/g,
  },
  {
    id: 'hardcoded-credential',
    label: 'hardcoded credential',
    re: /(?:DIDAXIS_(?:EMAIL|PASSWORD|API_TOKEN)|(?:\bpassword\b|\bapiToken\b))\s*[:=]\s*['"][^'"\s]{4,}['"]/gi,
  },
];

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('error', reject);
    process.stdin.on('end', () => {
      const buf = Buffer.concat(chunks);
      let raw = buf.toString('utf8');
      if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
      if (raw.includes('\u0000')) {
        raw = buf.toString('utf16le').replace(/^\uFEFF/, '');
      }
      resolve(raw);
    });
  });
}

function relativeToWorkspace(filePath, workspaceRoots) {
  const normalized = filePath.replace(/\\/g, '/');
  const roots = Array.isArray(workspaceRoots) ? workspaceRoots : [];
  const prefixes = [];
  for (const root of roots) {
    if (typeof root !== 'string' || root.length === 0) continue;
    const prefix = root.replace(/\\/g, '/').replace(/\/+$/, '');
    prefixes.push(prefix);
    if (/^\/[A-Za-z]:\//.test(prefix)) prefixes.push(prefix.slice(1));
  }
  for (const prefix of prefixes) {
    if (normalized.toLowerCase().startsWith(prefix.toLowerCase() + '/')) {
      return normalized.slice(prefix.length + 1);
    }
  }
  for (const marker of ['/tests/', '/pages/']) {
    const idx = normalized.toLowerCase().lastIndexOf(marker);
    if (idx !== -1) return normalized.slice(idx + 1);
  }
  return normalized;
}

function inHookScope(relativePath) {
  return HOOK_PATH_RE.test(relativePath);
}

function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out += ch;
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          out += source[i] + (source[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += source[i];
        if (source[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function countMatches(source, re) {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const globalRe = new RegExp(re.source, flags);
  return [...source.matchAll(globalRe)].length;
}

function filterEnvCredentialLines(source) {
  return source
    .split('\n')
    .filter((line) => !/process\.env|import\.meta\.env|\$\{/.test(line))
    .join('\n');
}

function introducedWontViolations(before, after) {
  const reasons = [];
  const beforeSafe = filterEnvCredentialLines(before);
  const afterSafe = filterEnvCredentialLines(after);

  for (const { id, label, re } of WONT_CHECKS) {
    const beforeCount = countMatches(beforeSafe, re);
    const afterCount = countMatches(afterSafe, re);
    if (afterCount > beforeCount) {
      reasons.push(`introduced ${label} (${id})`);
    }
  }
  return reasons;
}

function countExpect(source) {
  const matches = stripComments(source).match(/\bexpect\s*\(/g);
  return matches ? matches.length : 0;
}

function contentBeforeEdit(after, edits) {
  if (!Array.isArray(edits) || edits.length === 0) return null;
  if (edits.length === 1) {
    const { old_string: oldString, new_string: newString } = edits[0];
    if (
      typeof oldString === 'string' &&
      typeof newString === 'string' &&
      (after === newString || after.replace(/\r\n/g, '\n') === newString.replace(/\r\n/g, '\n'))
    ) {
      return oldString;
    }
  }
  let before = after;
  for (let i = edits.length - 1; i >= 0; i -= 1) {
    const { old_string: oldString, new_string: newString } = edits[i];
    if (typeof newString !== 'string') continue;
    const replacement = typeof oldString === 'string' ? oldString : '';
    if (newString.length === 0) continue;
    const idx = before.lastIndexOf(newString);
    if (idx === -1) return null;
    before = before.slice(0, idx) + replacement + before.slice(idx + newString.length);
  }
  return before;
}

function gitHeadContent(relativePath, cwd) {
  try {
    return execFileSync('git', ['show', `HEAD:${relativePath.replace(/\\/g, '/')}`], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function finish(code, message) {
  const payload = {
    permission: code === 0 ? 'allow' : 'deny',
    user_message: message,
    agent_message: message,
  };
  process.stdout.write(JSON.stringify(payload) + '\n', () => {
    process.exit(code);
  });
}

async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (err) {
    finish(2, `CONSTITUTION GUARD BLOCK: could not parse hook input: ${err.message}`);
    return;
  }

  const filePath = input.file_path || input.filePath || '';
  if (!filePath) {
    finish(0, 'CONSTITUTION GUARD ALLOW: no file_path on this afterFileEdit event.');
    return;
  }

  const workspaceRoots = input.workspace_roots || [];
  const relativePath = relativeToWorkspace(filePath, workspaceRoots);
  if (!inHookScope(relativePath)) {
    finish(0, `CONSTITUTION GUARD ALLOW: skipped ${relativePath} (not under tests/** or pages/**).`);
    return;
  }

  let after;
  try {
    after = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    finish(2, `CONSTITUTION GUARD BLOCK: could not read ${relativePath}: ${err.message}`);
    return;
  }

  const edits = input.edits || [];
  let before = contentBeforeEdit(after, edits);
  if (before === null) {
    const root = workspaceRoots[0] || process.cwd();
    before = gitHeadContent(relativePath, root);
  }
  if (before === null) before = '';

  const reasons = introducedWontViolations(before, after);

  if (SPEC_RE.test(relativePath)) {
    const beforeCount = countExpect(before);
    const afterCount = countExpect(after);
    if (afterCount < beforeCount) {
      reasons.push(
        `weakened expect( count ${beforeCount} → ${afterCount} (deleted or commented out)`,
      );
    }
  }

  if (reasons.length > 0) {
    finish(
      2,
      `CONSTITUTION GUARD BLOCK: ${relativePath}: ${reasons.join('; ')}. See .cursor/rules/constitution.mdc WON'T.`,
    );
    return;
  }

  finish(0, `CONSTITUTION GUARD ALLOW: ${relativePath}: no new WON'T violations.`);
}

main().catch((err) => {
  finish(2, `CONSTITUTION GUARD BLOCK: hook crashed: ${err && err.message ? err.message : err}`);
});
