# Plan: POS-1 — Request name: sidebar sync & validation

**Created**: 2026-05-10
**Author**: AI Plan Agent
**Status**: planning

---

## 1. Ticket Summary

The left sidebar request list reads from `useCollectionRequests`, which refetches only when the active collection changes. The request composer persists updates (including the name) directly to IndexedDB via `useRequestComposer.save`, without notifying the list. That yields a **split brain**: the composer shows the latest name while the sidebar keeps a stale `request.name`. Separately, the composer allows saving an **empty** name on every keystroke, which is inconsistent with sidebar rename rules (`handleUpdateRequestName` ignores empty) and can leave requests with blank titles. This ticket aligns list and composer on the same stored name, enforces non-empty names at the persistence layer, and **reverts** abandoned empty edits (blur or navigation) to the last saved name.

## 2. In Scope

- Keep the sidebar request list in sync with IndexedDB when a request in the current collection is updated from the composer (especially `name`).
- Validate request names: trim whitespace; **do not** persist blank names.
- When the user clears the name and leaves the field (blur) or switches to another request/collection without committing a valid name, the UI and storage retain the **previous** name (no empty overwrite).
- Unit/integration tests covering sync behaviour and empty-name rejection.

## 3. Out of Scope

- Renaming UX overhaul (inline validation copy, toasts).
- Debouncing all composer fields for performance (optional follow-up; may mention if name saves remain per-keystroke).
- Collection name validation (parallel pattern exists but not requested).
- Migrating existing data that might already have empty `name` strings (optional one-line note in open questions if product cares).

## 4. Assumptions & Constraints

| # | Assumption / Constraint | Impact if Wrong |
|---|------------------------|-----------------|
| 1 | Dexie `liveQuery` (from `dexie`) is acceptable for subscribing to `requests` / `collections` reads for the active collection | Use alternate strategy (e.g. explicit `reload` callback wired from composer) |
| 2 | “Same name” means the canonical `RequestRecord.name` in IndexedDB, shown in both list and composer | Clarify if a separate display field is intended |
| 3 | Trimming whitespace on commit matches product expectations | Adjust validation rules |

## 5. Architecture & Design

Today, **data flow** for names is:

1. **Sidebar**: `useCollectionRequests` → one-shot `loadRequests()` on `collectionId` change → `RequestListView` renders `request.name`.
2. **Composer**: `useRequestComposer` → `load()` on `requestId` change → `setName` → `save({ name })` → `database.requests.put`.

There is **no subscription** between (2) and (1), so the list does not refresh when (2) writes.

### Proposed data flow

- Extend `useCollectionRequests` to subscribe to reactive queries (Dexie `liveQuery`) that re-run when `collections` or `requests` rows relevant to the active collection change. Inside the query: read the collection’s `requestIds`, load each request, **sort results to match `requestIds` order** (today `anyOf().toArray()` order may not match collection order).
- Harden `useRequestComposer.setName`: reject whitespace-only / empty strings — **do not** call `save`, so IndexedDB and optimistic state never store blank names.
- In `RequestComposer`, bind the name field to **draft local state** synchronised from `request.name` when `requestId` or loaded `request.name` changes. On **blur**, if `draft.trim()` is empty, reset draft to `request.name` (and optionally set a short inline error). If non-empty, `setName(draft.trim())`. On **change**, update draft only (or call a debounced save for non-empty — simplest is blur + Enter to commit trimmed value, or keep immediate save only when trimmed length > 0).

### Component Tree (if applicable)

```
App
├── useCollectionRequests(collectionId)  ← liveQuery-backed list state
├── RequestListView(requestsState)
└── RequestComposer(requestId)
      └── name input (local draft + blur/validation)
```

### Data Flow

- IndexedDB remains the source of truth.
- `liveQuery` pushes updates to the list whenever a watched request or the collection’s `requestIds` changes.
- Composer draft prevents transient empty strings from being written; hook-level guard prevents empty `save` if any caller bypasses the UI.

### API Contract (if applicable)

| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| N/A | — | — | — | Local IndexedDB only |

## 6. Implementation Plan

### Existing local work (branch state)

- **Branch**: Already on `POS-1` (no checkout performed).
- **Uncommitted changes**: `.cursor/agents/develop-agent.mdc`, `.cursor/agents/plan-agent.mdc`, `.cursor/agents/review-agent.mdc`, `.cursor/rules/project.mdc` — pipeline/agent config only; **exclude from POS-1 PR** unless the team intentionally bundles them.
- **Commits ahead of `develop`**: None (`git log develop..HEAD` empty).
- **Alignment**: No application code changes yet for this ticket; local edits do not conflict with the plan.

### Slice 1: Reactive collection requests list

**Goal**: Sidebar list reflects IndexedDB updates made from the composer without manual `reload`.

**Files to create/modify**:

- `src/features/collections/useCollectionRequests.ts` — replace or augment the one-shot `useEffect` load with `liveQuery` from `dexie` (subscribe in `useEffect`, unsubscribe on cleanup). Preserve `reload()` for imperative refresh if still useful, or implement as re-fetch trigger key.
- Optional small helper to **order** `RequestRecord[]` by `requestIds` sequence.

**Tasks**:

- [ ] Import `liveQuery` and subscribe to a query that depends on `collectionId` and reads `collections` + `requests`.
- [ ] Map results to the same `CollectionRequestsState` shape; handle loading/error.
- [ ] Preserve ordering of requests to match `collection.requestIds`.
- [ ] Verify unsubscribe on unmount and when `collectionId` changes.

### Slice 2: Name validation in composer hook

**Goal**: Never persist empty/whitespace-only names; avoid optimistic UI with blank `name`.

**Files to create/modify**:

- `src/features/requests/useRequestComposer.ts` — in `setName`, trim and return early if empty; only call `save({ name: trimmed })` when valid.

**Tasks**:

- [ ] Add guard in `setName`.
- [ ] Add unit tests for `setName` behaviour (mock DB if needed, or test via exported pure helper if you extract trim/validate).

### Slice 3: Draft name field in RequestComposer

**Goal**: User can clear the input while editing; blur or navigation restores the last saved name; committed values are trimmed.

**Files to create/modify**:

- `src/features/requests/RequestComposer.tsx` — local `nameDraft` state; sync from `request.name` when `requestId` / loaded request identity changes; `onChange` updates draft; `onBlur` validates; optional `aria-invalid` / short error message for empty blur.
- `src/features/requests/RequestComposer.css` (only if existing patterns need a class for inline error).

**Tasks**:

- [ ] Initialise and reset `nameDraft` when `request` loads or `requestId` changes.
- [ ] On blur: empty → reset draft to `request.name`; non-empty → `composer.setName(trimmed)`.
- [ ] Ensure switching request without blur still shows correct name (effect reset handles this).

### Slice 4: Tests

**Goal**: Regressions caught automatically.

**Files to create/modify**:

- `src/features/collections/useCollectionRequests.test.ts` (new) or extend existing hooks tests — assert list updates when underlying Dexie data changes (may use fake IndexedDB / Dexie test patterns used elsewhere in repo).
- `src/features/requests/useRequestComposer.test.ts` (new) — empty name does not call `put`.
- Component test for name field blur/switch if feasible with Testing Library.

**Tasks**:

- [ ] Mirror existing Vitest + Testing Library patterns from the repo.
- [ ] Cover: whitespace-only rejected; valid trim persists; draft reset on invalid blur.

## 7. Testing Strategy

- **Unit tests**: `useRequestComposer.setName` validation; optional pure sort-by-`requestIds` helper; `useCollectionRequests` reactive updates if test harness supports Dexie + fake IDB.
- **Integration tests**: Simulate composer name change and assert sidebar would receive updated records (or E2E-style with Dexie in jsdom if already established).
- **Edge cases**: Rapid request switching with empty draft; collection switch while editing; concurrent list rename vs composer (last write wins — document expected behaviour).

## 8. Open Questions / Clarifications Needed

> If any, list here. These BLOCK approval until answered.

- Q1: Should we run a one-time migration to replace existing empty `name` values with a fallback (e.g. `Untitled request`) for older data?

## 9. Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-10 | Initial plan created | /plan command |
