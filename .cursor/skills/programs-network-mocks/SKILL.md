---
name: programs-network-mocks
description: Deterministic programs-flow edge cases via Playwright page.route.
  Apply when writing or reviewing specs that assert API failure, empty list,
  malformed responses, or auth/server errors on Didaxis /programs — even if
  the user only says "edge case" or "error state".
---

# Programs flow — network mocking

Use `page.route` to make programs API edge cases deterministic. Interact only
through existing POMs (`ProgramsPage`, `NewProgramModal`, `EditProgramModal`).
Register routes before navigation or the action that triggers the request.

## UI copy (required before assertions)

Before writing assertions, open the real page (Playwright MCP → browser MCP →
`agent-browser` → Playwright CLI). Read the **actual** error and empty-state
copy the app renders — do not invent strings. Prefer POM locators that already
encode recon (`ProgramsPage.emptyState`, `ProgramsPage.errorAlerts`,
`NewProgramModal.duplicateError()`, etc.); extend POMs only via handoff if copy
is missing. If the app renders nothing for a case, document that in the test
title/handoff instead of guessing.

## Never mock what you verify

Do not route the API call whose **correct** response is the behavior under test.
Example: a happy-path create must hit the real `POST` save; a dedicated
`503-on-save` test mocks only that save request while still using the real UI
path through POMs.

Typical Didaxis programs endpoints (confirm in Network tab during recon):

- `GET **/api/programs` — list (empty array → empty state)
- `POST **/api/programs` — create / save from New Program modal
- `PATCH **/api/programs/*` — edit save
- `DELETE **/api/programs/*` — do not mock in tests that assert delete success
  (cleanup fixture may still DELETE after the test)

## Required mock scenarios

Use `page.route` + `route.fulfill()` unless aborting the network on purpose.

| Case | Route | Fulfill | Assert (via POM + recon copy) |
|------|-------|---------|--------------------------------|
| **(a) Save unavailable** | `POST` (or `PATCH` for edit) `**/api/programs**` | `503`, optional body | UI error state visible (`errorAlerts` or modal error — use recon text) |
| **(b) Empty catalog** | `GET **/api/programs` | `200`, `[]` | Empty-state message (`emptyState` / `createFirstProgramButton`) |
| **(c) Malformed list** | `GET **/api/programs` | `200`, invalid JSON or wrong shape (e.g. `{}`, `"x"`, `[{ "name": 1 }]`) | App does not crash: programs shell visible (`heading`, no uncaught error UI); assert only what recon shows |

Skip `trackProgram` / create cleanup when the mock prevents a real UUID.

## Additional status codes (one test each)

Add separate tagged tests when product should handle these; recon first, then
assert only visible UI (or document "no user-visible message"):

| Code | Typical use in route | Notes |
|------|----------------------|--------|
| `401` | `GET` or `POST **/api/programs**` | Often session expired — may redirect to login |
| `403` | same | Forbidden / permission denied copy if any |
| `404` | `GET **/api/programs/**` or list URL | Not found / missing resource |
| `500` | save or list | Generic server error |
| `501` / `502` / `504` | save or list | Treat like upstream/gateway failure; align assert with recon (may match 503) |
| `429` | save or list | Rate limit message if shown |
| `300`–`399` | rare on XHR | Redirect or ambiguous body — assert stable shell or document no UI |
| **abort** | `route.abort()` | Network failure; assert error/ retry UI if recon shows it |

Use realistic `Content-Type` headers when returning JSON bodies.

## Test shape

- One Playwright **tag per test** (e.g. `{ tag: '@programs-503-save' }`) naming the mock.
- Stored session auth (`auth-strategy.md`); mock API, not login, unless the scenario is auth failure.
- Web-first `expect` on POM locators; no inline locators in specs.
- Unroute or use per-test `page` isolation so mocks do not leak (`await page.unrouteAll()` in `finally` if needed).

## Reference pattern (illustrative — URLs and copy from recon)

```typescript
await page.route('**/api/programs', async (route) => {
  if (route.request().method() === 'GET') {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return;
  }
  await route.continue();
});

const programs = new ProgramsPage(page);
await programs.goto();
await expect(programs.emptyState).toBeVisible();
```

Replace assertions with strings/locators confirmed on the live app.
