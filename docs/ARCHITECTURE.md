# Architecture Overview

## Scope
This application is a client-only API client PWA. There is no backend, no login, and no server-side storage. All user data remains local unless the user explicitly exports files.

## Planned Modules
- `src/app/`: shell, routing, providers, global state boundaries
- `src/features/requests/`: request composer, auth, headers, params, body editors
- `src/features/collections/`: collections, folders, saved requests, import/export
- `src/features/environments/`: environment management and scoped variables
- `src/features/responses/`: response rendering, timelines, diffs, previews
- `src/features/simulation/`: delay, failure, and edge-case tooling
- `src/features/ai/`: guarded AI workflows with redaction boundaries
- `src/lib/`: shared utilities, schema validation, storage adapters, security helpers

## Storage Model
- IndexedDB is the primary local data store.
- Separate stores should exist for collections, environments, request history, app settings, and secrets metadata.
- All persisted records must use versioned schemas and migration paths.
- The current implementation lives under `src/domain/` and `src/lib/storage/`, with Dexie-backed tables for requests, collections, environments, history, secrets, and settings.
- Seed-safe bootstrap data creates one starter request, collection, and environment so the local data layer is verifiable before the request composer UI exists.

## Offline Support
- The current baseline uses a local web app manifest and a repository-owned service worker under `public/`.
- Keep offline behavior simple and auditable until a stronger caching strategy is required.

## Security Boundaries
- Secrets are stored separately from general request metadata.
- Logs and AI prompts must pass through redaction utilities.
- Imports must be validated before persistence.

## Decision Records
Capture important decisions under `docs/adr/`. Initial ADRs should cover stack choice, local storage design, PWA strategy, and AI redaction boundaries.
