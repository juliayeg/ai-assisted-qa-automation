#!/usr/bin/env node
/**
 * Assertion guard for Playwright specs under tests/**.
 *
 * afterFileEdit matchers are compared to the tool name "Write", not the path,
 * so this script applies the tests/** filter itself.
 *
 * Blocks (exit 2) when an edit weakens the test: fewer active expect( calls
 * than before the edit, including expects that were commented out. Allows
 * locator-only POM-style patches that leave assertions intact.
 */
'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

const SPEC_RE = /^tests\/.+\.(?:spec|test)\.(?:[cm]?[jt]sx?)$/i;

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
  const marker = '/tests/';
  const idx = normalized.toLowerCase().lastIndexOf(marker);
  if (idx !== -1) return normalized.slice(idx + 1);
  return normalized;
}

function isSpecUnderTests(relativePath) {
  return SPEC_RE.test(relativePath);
}

/** Strip // and /* *\/ comments so commented-out expect( no longer counts. */
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

function countExpect(source) {
  const matches = stripComments(source).match(/\bexpect\s*\(/g);
  return matches ? matches.length : 0;
}

function contentBeforeEdit(after, edits) {
  if (!Array.isArray(edits) || edits.length === 0) return null;

  // Full-file write: single edit where new_string is the whole file.
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
    if (newString.length === 0) {
      // Insertion-only: cannot reverse reliably from after alone.
      continue;
    }
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
    finish(2, `ASSERTION GUARD BLOCK: could not parse hook input: ${err.message}`);
    return;
  }

  const filePath = input.file_path || input.filePath || '';
  if (!filePath) {
    finish(0, 'ASSERTION GUARD ALLOW: no file_path on this afterFileEdit event.');
    return;
  }

  const workspaceRoots = input.workspace_roots || [];
  const relativePath = relativeToWorkspace(filePath, workspaceRoots);
  if (!isSpecUnderTests(relativePath)) {
    finish(0, `ASSERTION GUARD ALLOW: skipped ${relativePath} (not a spec under tests/**).`);
    return;
  }

  let after;
  try {
    after = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    finish(2, `ASSERTION GUARD BLOCK: could not read ${relativePath}: ${err.message}`);
    return;
  }

  const edits = input.edits || [];
  let before = contentBeforeEdit(after, edits);
  if (before === null) {
    const root = workspaceRoots[0] || process.cwd();
    before = gitHeadContent(relativePath, root);
  }
  if (before === null) {
    finish(
      2,
      `ASSERTION GUARD BLOCK: ${relativePath}: cannot reconstruct pre-edit content (no usable edits[] and no git HEAD).`,
    );
    return;
  }

  const beforeCount = countExpect(before);
  const afterCount = countExpect(after);
  if (afterCount < beforeCount) {
    finish(
      2,
      `ASSERTION GUARD BLOCK: ${relativePath}: edit weakened the test — active expect( count ${beforeCount} → ${afterCount} (deleted or commented out). Never weaken or delete an assertion to pass.`,
    );
    return;
  }

  finish(
    0,
    `ASSERTION GUARD ALLOW: ${relativePath}: active expect( count ${beforeCount} → ${afterCount} (unchanged or stronger).`,
  );
}

main().catch((err) => {
  finish(2, `ASSERTION GUARD BLOCK: hook crashed: ${err && err.message ? err.message : err}`);
});
