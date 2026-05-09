# Development Tracker: POS-1

**Started**: 2026-05-10
**Branch**: POS-1
**Plan Reference**: `ai-dev/POS-1/plan.md`

---

## Overall Status: `done`

---

## Slices

### Slice 1: Reactive collection requests list
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 1.1 liveQuery subscription | `done` | `src/features/collections/useCollectionRequests.ts` | — |
| 1.2 Order by `requestIds` | `done` | `src/features/collections/useCollectionRequests.ts` | `orderRequestsByRequestIds` exported |
| 1.3 `reload` API | `done` | `src/features/collections/useCollectionRequests.ts` | No-op await; liveQuery keeps list fresh |

---

### Slice 2: Name validation in composer hook
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 2.1 `setName` guard | `done` | `src/features/requests/useRequestComposer.ts` | Trim; skip save if empty |
| 2.2 Primary composer parity | `done` | `src/features/requests/usePrimaryRequestComposer.ts` | Same guard |

---

### Slice 3: Draft name field in RequestComposer
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 3.1 Draft + blur / Enter | `done` | `src/features/requests/RequestComposer.tsx` | `.field-error-text` in `styles.css` |

---

### Slice 4: Tests
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 4.1 `orderRequestsByRequestIds` | `done` | `src/features/collections/useCollectionRequests.test.ts` | — |
| 4.2 `setName` empty | `done` | `src/features/requests/useRequestComposer.test.ts` | — |
| 4.3 Name field behaviour | `done` | `src/features/requests/RequestComposer.test.tsx` | Scoped queries + mock `req_1` |

---

## Requirement Drift Log

| Date | Change | Reason | Plan Updated? |
|------|--------|--------|---------------|
| 2026-05-10 | `src/test/setup.ts` global `afterEach(cleanup)` | Vitest was not unmounting RTL trees between tests (duplicate DOM) | No |
| 2026-05-10 | `ChatModal` `let md` → `const md` | ESLint `prefer-const` (pre-existing) | No |

---

## Blockers
| # | Blocker | Raised | Resolved |
|---|---------|--------|----------|
| — | — | — | — |
