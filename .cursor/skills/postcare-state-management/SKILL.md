---
name: postcare-state-management
description: >-
  State management for Postcare: current hooks + Dexie + Context patterns, and
  conventions for Redux Toolkit or Zustand if adopted (slices, selectors,
  async placement, global vs local vs URL). Use when designing data flow,
  persistence, navigation state, or evaluating a client store.
disable-model-invocation: true
---

# Postcare state management

## What this repo uses today

There is **no Redux Toolkit, Zustand, or React Router** in the codebase right now.

| Layer | Mechanism | Role |
|-------|-----------|------|
| **Persisted domain data** | **Dexie** (`src/lib/storage/db.ts`) | Collections, requests, environments—**source of truth on disk**. |
| **Server-shaped state in hooks** | **`useState` + `useEffect` + async functions** in feature hooks | Load/mutate Dexie; expose `{ data, isLoading, error }` and imperative actions (`useCollections`, `useEnvironments`, …). |
| **Shell / selection UI** | **`useState` in `App.tsx`** | Selected collection/request/environment, sidebar tab, modal flags—**ephemeral** unless you later sync to URL. |
| **Cross-cutting UI service** | **React Context** | `ConfirmProvider` / `useConfirm` (`src/hooks/`) for app-wide confirm dialog API. |

**Implications**

- **“Global state”** today means: **Dexie** (persistent) + **top-level React state** (session UI). There is no centralised in-memory normalised cache unless you add one.
- **Async** lives in **feature hooks** (and `lib/` helpers they call)—not in thunks or store middleware.
- **URL state** (`useSearchParams`) is **not used**; deep-linking and shareable URLs would require adding a router and a deliberate mapping (see below).

When adding a store (RTK or Zustand), treat it as a **new architectural decision**: document it in `AGENTS.md` and migrate incrementally—**do not duplicate** Dexie as a second source of truth without a sync strategy.

---

## Global vs local vs persisted vs URL

Use this decision table for **new** work (matches current philosophy even without a store).

| Kind of state | Examples | Where it belongs |
|---------------|----------|------------------|
| **Persisted user data** | Collections, requests, env vars | **Dexie** + thin feature hooks; components do not touch `database` directly unless unavoidable. |
| **Session / UI chrome** | Open panel, sidebar tab, transient filters | **`useState`** in the smallest owner (`App` or feature root)—lift only when multiple siblings need it. |
| **Derived** | Filtered list from collections + search string | **`useMemo`** (or compute in render if cheap)—**not** copied into another `useState` synced by effect. |
| **Cross-tree imperative API** | Confirm dialog, toast host, theme (future) | **Context** with a **narrow API**; split “read” vs “write” contexts if you need to avoid broad re-renders. |
| **Shareable / bookmarkable** | Selected request id, tab, comparison mode | **URL** (`useSearchParams` + router)—once the app has routes; keeps refreshes and links stable. |
| **Server-authoritative remote API** (future) | Profiles, billing | Prefer **explicit hooks** or **RTK Query** / **TanStack Query**—not a giant hand-written cache in `useState`. |

**Anti-pattern here:** mirroring Dexie into a global client store **without** a clear reason (offline queue, optimistic UI, or cross-window sync)—that doubles writes and bugs.

---

## If you adopt Redux Toolkit (RTK)

### Slice naming

- **One slice per domain area**, aligned with features: `collectionsSlice`, `requestsSlice`, `environmentsSlice`, `uiSlice` (only for true global UI flags).
- File names: `collectionsSlice.ts` or `features/collections/collectionsSlice.ts` if colocated.
- **Avoid** vague names like `dataSlice` or `appSlice` unless the slice is genuinely app-wide and tiny.

### State shape

- **Normalise** lists keyed by `id` when random access and updates are frequent; **arrays** are fine for small, ordered lists that match Dexie reads.
- Keep **RTK state for client/session concerns**; if Dexie remains source of truth, prefer **listeners or explicit sync** over letting UI write to both blindly.

### Selectors

- **Colocated selectors** next to the slice: `selectCollectionsById`, `selectActiveCollectionId`.
- Use **`createSelector`** from Reselect when deriving filtered/sorted lists from normalised maps to memoise.
- **Components** should use `useAppSelector(selectX)` with **stable selector references** (define selectors outside the component or with `createSelector`).

### Where async lives

| Approach | Use when |
|----------|----------|
| **`createAsyncThunk`** | One-off loads/mutations, imperative flows, Dexie/REST side effects; keep `extraReducers` thin. |
| **RTK Query** | REST (or similar) **resources** with caching, invalidation, and tags; **not** a replacement for Dexie unless you drop local-first. |
| **Listeners (`listenerMiddleware`)** | Cross-slice reactions, analytics, persistence side effects after specific actions. |
| **Sagas** | **Do not add** unless the team already standardises on them—RTK defaults favour thunks + RTK Query. |

**Postcare-specific:** if RTK coexists with Dexie, put **“write to Dexie”** inside thunks or listener middleware after a single defined action—avoid scattering `database.*` in components.

---

## If you adopt Zustand

### Store naming

- Prefer **one store per domain** (`useCollectionsStore`) or a **single store with slice helpers** (`create` + immer middleware) if you want one devtools tree—pick one team convention and stick to it.
- **File names:** `collectionsStore.ts`, `useCollectionsStore.ts`.

### Selectors

- **Subscribe to slices:** `useCollectionsStore((s) => s.collections)`—avoid `useCollectionsStore()` with no selector (re-renders on any change).
- **Shallow compare** multiple fields: `useShallow` from `zustand/react/shallow` when selecting an object/tuple of primitives.

### Where async lives

| Approach | Use when |
|----------|----------|
| **Actions on the store** (`set` + async/await) | Simple flows; keep actions in the same module as the store. |
| **`zustand/middleware` (`immer`, `devtools`, `persist`)** | Immer for nested updates; `persist` only if you understand overlap with **Dexie** (usually avoid double persistence). |
| **External data fetching** | Prefer **TanStack Query** or thin hooks that call `set` on success—**or** RTK Query if the team standardises on RTK for HTTP. |

---

## URL state (`useSearchParams`) — when you add a router

Use **URL** for anything users might **bookmark, share, or refresh** and expect to restore:

- Active collection / request id (path or query—team choice).
- Modal query params (`?help=1`) sparingly.

**Do not** put large JSON or secrets in the URL. Keep **sensitive** state in memory or Dexie only.

**Pattern:** a small **`useSyncedSelection`**-style hook that reads `useSearchParams` on mount and writes on user navigation, with **feature hooks** still owning Dexie loads.

---

## Checklist (PR / design review)

- [ ] Persisted data goes through **Dexie** (until a deliberate migration).
- [ ] No duplicate “sources of truth” for the same entity without a documented sync rule.
- [ ] Loading and error surfaced for async paths (feature hooks or store).
- [ ] If a store is added: **slice/store naming**, **selectors**, and **async location** follow the sections above and are documented in `AGENTS.md`.
