---
name: postcare-testing-patterns
description: >-
  Testing conventions for Postcare: Vitest + Testing Library, query priority,
  file layout, vi.mock vs MSW, async queries, and factories from domain/models.
  Use when writing or reviewing tests, debugging flakes, or choosing mock
  boundaries.
disable-model-invocation: true
---

# Postcare testing patterns

**Runner:** **Vitest** (`npm run test`, `npm run test:watch`) with **jsdom** and `./src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.  
This is **not** Jest—use **`vi.mock`**, **`vi.fn`**, **`vi.stubGlobal`**, **`vi.hoisted`**.

---

## Query priority (React Testing Library)

Prefer queries that reflect how users interact with the UI ([official guidance](https://testing-library.com/docs/queries/about#priority)):

1. **`getByRole`** — default; pair with accessible `name` (visible text, `aria-label`, or associated label). Use `heading`, `button`, `dialog`, `tab`, etc.
2. **`getByLabelText`** — form fields tied to `<label>` or `aria-label`.
3. **`getByPlaceholderText`** — only when label strategy is weak (prefer fixing the component).
4. **`getByText`** — static copy; use **regex** for partial or case-flexible matches when appropriate.
5. **`getByTestId`** — **last resort** when roles/names are not practical (e.g. third-party widgets); add `data-testid` sparingly.

**`queryBy*`** when asserting absence; **`getBy*`** when the element must exist synchronously after render.

---

## Async queries and `waitFor`

- Use **`findByRole` / `findByText` / …** when the element appears after async work (network, `useEffect`, state updates). They return a **Promise** and combine `waitFor` + `getBy*`.
- Use **`waitFor`** when asserting non-DOM conditions (e.g. mock call counts, hook state) or multiple conditions together.
- Wrap synchronous state updates from act-sensitive code in **`act`** when using **`renderHook`** and imperative calls (see `useRequestComposer.test.ts`).

**Hook tests:** `renderHook` + `waitFor(() => expect(result.current...))` until stable.

---

## File structure (this repo)

| Pattern | Location | Example |
|---------|----------|---------|
| **Colocated unit / integration** | Same directory as source | `useRequestComposer.test.ts`, `RequestComposer.test.tsx` |
| **Focused a11y suite** | Same feature; suffix in name | `ResponseComparisonPanel.accessibility.test.tsx` |
| **Pure `lib` / `domain` tests** | Next to module | `src/lib/redaction/redaction.test.ts`, `src/lib/storage/migration.test.ts` |
| **App-level smoke** | `src/App.test.tsx` | Full tree; tolerates environment quirks (e.g. IndexedDB messaging). |

**Naming:** `*.test.ts` or `*.test.tsx` (Vitest picks them up via Vite config—no separate jest config).

**Do not** create a parallel `__tests__` tree unless a feature becomes large enough to justify it; colocation is the default here.

---

## What gets mocked — and how

### Current practice (no MSW in this project)

Tests use **Vitest mocks**, not MSW:

| Boundary | How it’s mocked | Example |
|----------|------------------|---------|
| **React hooks / heavy UI children** | **`vi.mock('./module', () => ({ ... }))`** | `RequestComposer.test.tsx` mocks `useRequestComposer`, `useRequestExecution`, and child panels to isolate cURL import behaviour. |
| **Dexie / `database`** | **`vi.mock('../../lib/storage/db', …)`** with **`vi.hoisted`** for `mockGet` / `mockPut` | `useRequestComposer.test.ts` — keeps tests fast and deterministic. |
| **`fetch`** | **`vi.stubGlobal('fetch', mockFetch)`** | `cerebrasClient.test.ts` asserts URL, headers, body. |
| **`localStorage`** | **`vi.stubGlobal('localStorage', { … })`** | Same file — in-memory `Map` backing. |

**`vi.hoisted`:** use when mock implementations must reference variables defined in the mock factory (see Vitest docs); pattern in `useRequestComposer.test.ts`.

### MSW vs `vi.mock` / stubbed `fetch`

- **Today:** **Prefer `vi.stubGlobal('fetch', …)` or small wrapper mocks** for HTTP clients in `src/lib/**`—matches existing `cerebrasClient.test.ts` and avoids extra deps.
- **Consider MSW** only if you need many endpoints, realistic interception across components, or shared handlers between tests—**MSW is not a project dependency yet**; adding it is a team choice (update `package.json` + a single `server` setup file).

**Rule of thumb:** mock the **module under test’s boundary** (e.g. `database` for hooks that persist; `fetch` for AI client), not deep implementation details.

---

## User interactions

- Always **`const user = userEvent.setup()`** then `user.click`, `user.type`, `user.paste`, etc. (`RequestComposer.test.tsx`, `App.test.tsx`).
- Prefer **role + name** in clicks: `getByRole('button', { name: 'Apply to composer' })`.

---

## Test data factories and fixtures

### Use `src/domain/models.ts` first

Shared builders already exist—**reuse them** instead of duplicating shapes:

- **`createDefaultRequest()`** — baseline `RequestRecord`.
- **`createKeyValueEntry(key, value, overrides)`** — key/value rows.
- **`createId(prefix)`**, **`createTimestamp()`** — ids and ISO times (note: `createId` uses `crypto.randomUUID()`; fine in jsdom).

### Local test-only helpers

When a suite needs a specialised record, add a **small function in the test file** (not exported to prod):

```ts
function createLoadedRequest(): RequestRecord {
  return {
    ...createDefaultRequest(),
    id: 'req_import',
    auth: { type: 'bearer', config: { token: 'stale-token' } },
  }
}
```

**Inline fixtures:** for a11y or presentation tests, **minimal props objects** inline in `render(...)` are OK (`ResponseComparisonPanel.accessibility.test.tsx`).

**Secrets:** never put real API keys in tests; use obvious placeholders (`test-key`).

---

## Checklist for new tests

- [ ] Query order follows **role → label → text → testId**.
- [ ] Async UI uses **`findBy*`** or **`waitFor`**; no arbitrary `sleep`.
- [ ] Mocks target **clear boundaries** (`database`, `fetch`, heavy hooks).
- [ ] **`vi.hoisted`** used where the mock factory needs shared `vi.fn` instances.
- [ ] Data built with **`createDefaultRequest` / `createKeyValueEntry`** or documented local helpers.
- [ ] **`userEvent.setup()`** for interactions.

---

## Config reference

- **`vite.config.ts`** — `test.environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, `css: true`.
- **`src/test/setup.ts`** — jest-dom matchers for Vitest.
