import { test as base, expect, type Page } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

type ApiTokenHolder = { value?: string };

async function deleteProgram(programId: string, token: string): Promise<number> {
  const response = await fetch(`${baseURL}/api/programs/${programId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.status;
}

export const test = base.extend<
  { trackProgram: (programId: string) => void },
  { programIdsToCleanup: Set<string>; apiToken: ApiTokenHolder }
>({
  apiToken: [
    async ({}, use) => {
      await use({});
    },
    { scope: 'worker' },
  ],

  programIdsToCleanup: [
    async ({ apiToken }, use) => {
      const ids = new Set<string>();
      await use(ids);
      await runProgramCleanup(ids, apiToken, 'worker teardown');
    },
    { scope: 'worker' },
  ],

  trackProgram: async ({ programIdsToCleanup, apiToken }, use, testInfo) => {
    const idsThisTest: string[] = [];
    await use((programId: string) => {
      idsThisTest.push(programId);
      programIdsToCleanup.add(programId);
    });
    await runProgramCleanup(
      new Set(idsThisTest),
      apiToken,
      `after "${testInfo.title}"`,
      programIdsToCleanup,
    );
  },
});

async function runProgramCleanup(
  ids: Set<string>,
  apiToken: ApiTokenHolder,
  label: string,
  registryToUpdate?: Set<string>,
): Promise<void> {
  if (ids.size === 0) {
    return;
  }
  const token = apiToken.value ?? process.env.DIDAXIS_API_TOKEN;
  if (!token) {
    console.warn(
      `[api-cleanup] ${label}: skipped ${ids.size} program(s) — log in so a Bearer token is captured, or set DIDAXIS_API_TOKEN`,
    );
    return;
  }
  for (const id of ids) {
    const status = await deleteProgram(id, token);
    console.log(`[api-cleanup] ${label}: DELETE /api/programs/${id} → ${status}`);
    if (status === 200 || status === 404) {
      registryToUpdate?.delete(id);
    } else {
      console.warn(`[api-cleanup] ${label}: failed to delete ${id} (HTTP ${status})`);
    }
  }
}

export { expect };

export function captureApiTokenFromPage(page: Page, apiToken: ApiTokenHolder): void {
  page.on('request', (request) => {
    const auth = request.headers()['authorization'];
    if (auth?.startsWith('Bearer ') && /\/api\//.test(request.url())) {
      apiToken.value = auth.slice('Bearer '.length);
    }
  });
}

export function trackProgramCreatesFromResponses(
  page: Page,
  trackProgram: (programId: string) => void,
): void {
  page.on('response', async (response) => {
    if (response.request().method() !== 'POST' || !/\/api\/programs/.test(response.url())) {
      return;
    }
    if (response.status() !== 201) {
      return;
    }
    try {
      const body = (await response.json()) as { data?: { id?: string } };
      const id = body.data?.id;
      if (id) {
        trackProgram(id);
      }
    } catch {
      // ignore parse errors
    }
  });
}
