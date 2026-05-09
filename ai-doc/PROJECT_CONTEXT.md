# Postcare — project context (rollup)

> **Generated:** 2026-05-10T01:56:00Z · **Command:** `/reldoc`
> **Sources:** 1 ticket doc(s) from `ai-dev/*/documentation.md`
> **For AI agents:** Read **§TL;DR** and **§Orientation**, then jump via **§Contents** to the relevant cluster. Prefer this file over re-reading every ticket doc.

---

## TL;DR

Postcare is a local-first, offline-capable API client that stores data securely on-device via IndexedDB. It offers full request composing, environment variables with secret redaction, response viewing/comparison, and AI assistance using redacted previews, all without requiring a backend or cloud sync.

---

## Contents

- [TL;DR](#tldr)
- [Orientation](#orientation)
- [Stack & invariants](#stack--invariants)
- [Feature map (tree)](#feature-map-tree)
- [Ticket index](#ticket-index)
- [By theme](#by-theme)
- [Cross-cutting concerns](#cross-cutting-concerns)
- [Verification snapshot](#verification-snapshot)
- [Source manifest](#source-manifest)

---

## Orientation

- **Repo root:** `postcare/`
- **Main app entry / config:** `src/App.tsx`
- **Where features live:** `src/features/` (collections, environments, help, requests, storage, chat)
- **Where shared logic lives:** `src/lib/` (ai, body, codegen, comparison, importexport, redaction, storage, variables)
- **Docs / ADRs:** `docs/`

---

## Stack & invariants

- React 19 + TypeScript, Vite 6
- Storage: IndexedDB via Dexie
- Testing: Vitest + Testing Library
- Styling: Vanilla CSS with custom design tokens
- Invariants: Local-first (no cloud sync), strict secret redaction for AI, offline-capable (PWA)

---

## Feature map (tree)

- **Requests**
  - POS-1 — Sync Request List Names and Validate Composer Name

---

## Ticket index

| Ticket | Theme | Summary | Doc path |
|--------|-------|---------|----------|
| POS-1 | Requests | Sidebar request list automatically syncs with composer renames and prevents blank names. | `ai-dev/POS-1/documentation.md` |

---

## By theme

### Requests

#### POS-1 — Sync Request List Names and Validate Composer Name

- **Doc:** `ai-dev/POS-1/documentation.md`
- **AI hint:** Touches `src/features/collections/useCollectionRequests.ts` and `src/features/requests/RequestComposer.tsx` for `liveQuery` sync and draft state.
- Request names update instantly in the left sidebar as renamed in the composer (powered by Dexie `liveQuery`).
- Safely clear request name input without permanently saving a blank title (reverts on blur).
- Strict validation at persistence layer explicitly rejects empty or whitespace-only names.
- Existing redundant `reload` calls return instantly; future cleanups can remove them.
- Does not migrate or fix requests already saved with a blank name.

---

## Cross-cutting concerns

- **Storage/migrations:** Local IndexedDB using Dexie; UI must reflect reactive database updates.
- **AI integration & redaction:** AI flows use redacted previews to ensure raw credentials never reach prompt text.

---

## Verification snapshot

- `npm run test` for unit/integration suites.
- Manual rename check: Edit a request name in composer and press `Enter` to see instant sidebar update.
- Manual validation check: Delete entire name in composer and blur focus to verify inline error and reversion.

---

## Source manifest

| Ticket | documentation.md path | Last synthesised (run time) |
|--------|----------------------|------------------------------|
| POS-1 | `ai-dev/POS-1/documentation.md` | 2026-05-10T01:56:00Z |

---

## Maintainers

- Regenerate after meaningful ticket merges: `/reldoc`
- Per-ticket narrative: `/document <ticket>` (pipeline default under `ai-dev/`; copy or symlink to `ai-doc/<ticket>/` if you want ai-doc-only sources next run)
