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
| 1.1 Import `liveQuery` and subscribe to reactive query | `done` | `src/features/collections/useCollectionRequests.ts` | Subscribes to `collectionId`-dependent query reading `collections` + `requests` |
| 1.2 Map results to `CollectionRequestsState` shape | `done` | `src/features/collections/useCollectionRequests.ts` | Handles loading/error/missing collection states |
| 1.3 Preserve ordering via `orderRequestsByRequestIds` | `done` | `src/features/collections/useCollectionRequests.ts` | Pure helper exported for testability; drops stale ids |
| 1.4 Verify unsubscribe on unmount and `collectionId` change | `done` | `src/features/collections/useCollectionRequests.ts` | Cleanup returned from `useEffect` |

---

### Slice 2: Name validation in composer hook
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 2.1 Add guard in `setName` | `done` | `src/features/requests/useRequestComposer.ts` | Trims input, returns early if empty — prevents `save()` call |
| 2.2 Unit tests for `setName` behaviour | `done` | `src/features/requests/useRequestComposer.test.ts` | Tests: empty/whitespace rejected, valid name trimmed and persisted |

---

### Slice 3: Draft name field in RequestComposer
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 3.1 Initialise and reset `nameDraft` on request load | `done` | `src/features/requests/RequestComposer.tsx` | `useEffect` syncs from `readyRequest.name`; deps narrowed to avoid resetting on unrelated saves |
| 3.2 On blur: empty → reset draft; non-empty → save trimmed | `done` | `src/features/requests/RequestComposer.tsx` | Inline error shown via `role="alert"`; Enter key triggers blur |
| 3.3 Switching request without blur shows correct name | `done` | `src/features/requests/RequestComposer.tsx` | Effect reset on `readyRequest?.id` handles this |

---

### Slice 4: Tests
**Status**: `done`

| Task | Status | File | Notes |
|------|--------|------|-------|
| 4.1 `orderRequestsByRequestIds` test | `done` | `src/features/collections/useCollectionRequests.test.ts` | Verifies ordering + stale id filtering |
| 4.2 `setName` empty rejection test | `done` | `src/features/requests/useRequestComposer.test.ts` | Asserts `put` not called for empty/whitespace |
| 4.3 `setName` trim-and-save test | `done` | `src/features/requests/useRequestComposer.test.ts` | Verifies trimmed value persisted |
| 4.4 Name field blur revert test | `done` | `src/features/requests/RequestComposer.test.tsx` | Clears → tabs → asserts reverted value + alert shown |
| 4.5 Name field trim-on-blur test | `done` | `src/features/requests/RequestComposer.test.tsx` | Types padded string → tabs → asserts `setName` called with trimmed |

---

## Requirement Drift Log
> If implementation deviates from plan due to changed requirements, log it here.

| Date | Change | Reason | Plan Updated? |
|------|--------|--------|---------------|
| — | — | — | — |

---

## Blockers
| # | Blocker | Raised | Resolved |
|---|---------|--------|----------|
