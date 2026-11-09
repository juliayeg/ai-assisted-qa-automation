#!/usr/bin/env node
/**
 * Generation gate for Playwright specs under tests/**.
 *
 * afterFileEdit matchers are compared to the tool name "Write", not the path,
 * so this script applies the tests/** filter itself. Exit 0 allows. Exit 2 blocks.
 */
'use strict';

const fs = require('fs');

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

function readQuoted(source, quoteIndex) {
  const quote = source[quoteIndex];
  if (quote !== "'" && quote !== '"' && quote !== '`') return null;
  let value = '';
  for (let i = quoteIndex + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      value += source[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (ch === quote) return { value, end: i };
    value += ch;
  }
  return null;
}

function badPageLocators(source) {
  const needle = 'page.locator(';
  const found = [];
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(needle, from);
    if (start === -1) break;
    const before = start === 0 ? '' : source[start - 1];
    if (before && /[\w$]/.test(before)) {
      from = start + needle.length;
      continue;
    }
    let i = start + needle.length;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    const quoted = readQuoted(source, i);
    if (quoted && (quoted.value.includes('.') || quoted.value.includes('#') || quoted.value.includes('//'))) {
      found.push(quoted.value);
    }
    from = start + needle.length;
  }
  return found;
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
    finish(2, `GENERATION GATE BLOCK: could not parse hook input: ${err.message}`);
    return;
  }

  const filePath = input.file_path || input.filePath || '';
  if (!filePath) {
    finish(0, 'GENERATION GATE ALLOW: no file_path on this afterFileEdit event.');
    return;
  }

  const relativePath = relativeToWorkspace(filePath, input.workspace_roots);
  if (!isSpecUnderTests(relativePath)) {
    finish(0, `GENERATION GATE ALLOW: skipped ${relativePath} (not a spec under tests/**).`);
    return;
  }

  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    finish(2, `GENERATION GATE BLOCK: could not read ${relativePath}: ${err.message}`);
    return;
  }

  const reasons = [];
  if (!source.includes('expect(')) {
    reasons.push('spec contains no expect( (a test that asserts nothing)');
  }
  const locators = badPageLocators(source);
  if (locators.length > 0) {
    const shown = locators.map((selector) => JSON.stringify(selector)).join(', ');
    reasons.push(`CSS or XPath locator via page.locator (selector contains '.', '#', or '//'): ${shown}`);
  }

  if (reasons.length > 0) {
    finish(2, `GENERATION GATE BLOCK: ${relativePath}: ${reasons.join('; ')}`);
    return;
  }

  finish(0, `GENERATION GATE ALLOW: ${relativePath} has expect( and no CSS/XPath page.locator.`);
}

main().catch((err) => {
  finish(2, `GENERATION GATE BLOCK: hook crashed: ${err && err.message ? err.message : err}`);
});
