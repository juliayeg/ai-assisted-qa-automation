/**
 * Manual maintenance — excluded from `npx playwright test` (see testIgnore).
 *
 * List (dry run):
 *   npm run test:programs
 *
 * Delete first N (API list order):
 *   $env:PROGRAMS_DELETE_COUNT=100; npm run test:programs
 *
 * Delete all:
 *   $env:PROGRAMS_DELETE_ALL='1'; npm run test:programs
 *
 * Auth: DIDAXIS_API_TOKEN in .env, or admin login (DIDAXIS_EMAIL / DIDAXIS_PASSWORD).
 */
import dotenv from 'dotenv';
import path from 'path';

import { test, expect } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

type ProgramRecord = { id: string; name?: string };

async function resolveApiToken(page: import('@playwright/test').Page): Promise<string> {
  if (process.env.DIDAXIS_API_TOKEN) {
    return process.env.DIDAXIS_API_TOKEN;
  }

  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  test.skip(!email || !password, 'Set DIDAXIS_API_TOKEN or DIDAXIS_EMAIL / DIDAXIS_PASSWORD');

  let captured: string | undefined;
  page.on('request', (request) => {
    const auth = request.headers()['authorization'];
    if (auth?.startsWith('Bearer ') && /\/api\//.test(request.url())) {
      captured = auth.slice('Bearer '.length);
    }
  });

  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60_000 });
  await page.goto(`${baseURL}/programs`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'New Program' }).waitFor({ timeout: 60_000 });

  expect(captured, 'Log in and load /programs so a Bearer token is captured').toBeTruthy();
  return captured!;
}

async function fetchProgramIds(
  request: import('@playwright/test').APIRequestContext,
  token: string,
): Promise<string[]> {
  const response = await request.get(`${baseURL}/api/programs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `GET /api/programs failed: HTTP ${response.status()}`).toBeTruthy();

  const body = (await response.json()) as { data?: ProgramRecord[] };
  const rows = body.data ?? [];

  const programIds: string[] = [];
  for (const program of rows) {
    if (program.id) {
      programIds.push(program.id);
    }
  }
  return programIds;
}

function idsToDelete(programIds: string[]): string[] {
  const deleteAll =
    process.env.PROGRAMS_DELETE_ALL === '1' || process.env.PROGRAMS_DELETE_ALL === 'true';
  const countRaw = process.env.PROGRAMS_DELETE_COUNT?.trim();
  const deleteCount = countRaw ? Number.parseInt(countRaw, 10) : 0;

  if (deleteAll) {
    return [...programIds];
  }
  if (Number.isFinite(deleteCount) && deleteCount > 0) {
    return programIds.slice(0, deleteCount);
  }
  return [];
}

test.describe('Manual — programs bulk delete', () => {
  test.describe.configure({ mode: 'serial' });

  test('GET programs and optionally DELETE by count or all', async ({ page, request }) => {
    test.setTimeout(3_600_000);

    const token = await resolveApiToken(page);
    const programIds = await fetchProgramIds(request, token);

    console.log(`[programs-maintenance] GET /api/programs → ${programIds.length} id(s) in programIds[]`);

    const targets = idsToDelete(programIds);
    if (targets.length === 0) {
      console.log(
        '[programs-maintenance] Dry run only. Set PROGRAMS_DELETE_COUNT=<n> or PROGRAMS_DELETE_ALL=1 to delete.',
      );
      return;
    }

    console.log(
      `[programs-maintenance] Deleting ${targets.length} program(s) (${programIds.length} total in list)…`,
    );

    let deleted = 0;
    let failed = 0;
    for (const id of targets) {
      const response = await request.delete(`${baseURL}/api/programs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const status = response.status();
      if (status === 200 || status === 404) {
        deleted += 1;
      } else {
        failed += 1;
        console.warn(`[programs-maintenance] DELETE ${id} → HTTP ${status}`);
      }
    }

    console.log(`[programs-maintenance] Done. deleted=${deleted}, failed=${failed}`);
    expect(failed, 'Some DELETE requests failed').toBe(0);
  });
});
