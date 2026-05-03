# Acceptance Criteria

This file defines implementation-entry criteria for major feature areas. New work should not start unless criteria exist and are linked from a tracker item.

## Request Composer
- Supports `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
- Users can edit URL, headers, query params, and body.
- Edits persist locally and survive page reload.
- Auth modes include `none`, `apiKey`, `bearer`, `basic`, `oauth2` placeholder.

## Request Execution
- Executes requests from browser `fetch` with active environment substitutions.
- Stores success and failure entries in local history.
- Shows response status, duration, headers, and body.
- Provides trace logs and diagnostics for each run.

## Response Analysis
- Compares responses across environments.
- Highlights diff for headers, payload lines, and JSON structure.
- Supports side-by-side and unified views.

## Simulation
- Supports simulation modes: off, network error, timeout, HTTP error, malformed JSON, empty body, large payload.
- Supports optional delay and forced status code inputs.
- Simulation output is clearly marked via diagnostic metadata.

## AI Assistance
- Generates request improvement and edge-case suggestions from current request.
- Redacts sensitive data before AI analysis.
- Never exposes raw secrets in UI output generated from AI analysis context.

## Security and Dependency Policy
- Uses only open source dependencies with acceptable licenses.
- Runs lint, typecheck, tests, and security checks in CI.
- Redacts sensitive values in logs, diagnostics, and AI context.

## PWA and Offline
- Includes installable web manifest.
- Service worker caches app shell and has an offline fallback behavior.

## Migration and Storage
- Storage schema version is tracked in settings.
- Migration plan is derivable from stored schema version.
- Seed data bootstrap remains idempotent.
