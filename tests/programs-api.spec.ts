import { test, expect } from '@playwright/test';

import { ApiRoutes } from '../test-data/enums/api-routes';

test.describe('Programs API contract', () => {
  test(
    'GET /api/programs returns 200 when authorized',
    { tag: '@api' },
    async ({ request }) => {
      const token = process.env.DIDAXIS_API_TOKEN;
      test.skip(!token, 'Set DIDAXIS_API_TOKEN for API contract check');

      const response = await request.get(ApiRoutes.programs, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok(), `GET ${ApiRoutes.programs} failed: HTTP ${response.status()}`).toBeTruthy();
      const body = (await response.json()) as { data?: unknown[] };
      expect(Array.isArray(body.data)).toBeTruthy();
    },
  );
});
