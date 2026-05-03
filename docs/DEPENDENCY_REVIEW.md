# Dependency Review

Review date: 2026-04-25
Scope: direct `dependencies` and `devDependencies` in `package.json`.

## Summary
- All direct dependencies are open source.
- License set is `MIT` or `Apache-2.0` for all direct dependencies.
- Security checks are enforced in CI via `npm audit`, `gitleaks`, and `semgrep` workflows.

## Runtime Dependencies
- `react` (`MIT`): UI runtime; active and broadly maintained.
- `react-dom` (`MIT`): browser rendering runtime for React.
- `dexie` (`Apache-2.0`): IndexedDB abstraction for local-first persistence.

## Development Dependencies
- `vite`, `@vitejs/plugin-react` (`MIT`): local dev server and bundling.
- `typescript`, `@types/react`, `@types/react-dom` (`Apache-2.0`/`MIT`): static typing and editor safety.
- `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (`MIT`): lint and static quality checks.
- `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (`MIT`): test runtime and UI testing.

## Risk Notes
- Browser-only architecture depends on client-side storage APIs. If IndexedDB is unavailable, app behavior degrades to guarded unavailable/error states.
- `jsdom` is test-only and not shipped to production.
- Version upgrades must continue to pass existing security workflows and test suite before merge.

## Approval
- Direct dependencies meet current open-source-only policy requirements.
- Re-review is required when adding or replacing direct dependencies.
