# Postcare

Postcare is a local-first API client PWA inspired by Postman. The app is intended to run without a backend, store data on-device, and layer AI features on top of secure request authoring, collections, environments, response analysis, and import/export workflows.

## Current Status
- Planning and repository setup are in progress.
- Core requirements live in [docs/PROJECT_PLAN.md](/Users/ashwaryjharbade/Projects/postcare/docs/PROJECT_PLAN.md).
- Active task tracking lives in [docs/TRACKER.md](/Users/ashwaryjharbade/Projects/postcare/docs/TRACKER.md).
- Acceptance criteria live in [docs/ACCEPTANCE_CRITERIA.md](/Users/ashwaryjharbade/Projects/postcare/docs/ACCEPTANCE_CRITERIA.md).
- Dependency review notes live in [docs/DEPENDENCY_REVIEW.md](/Users/ashwaryjharbade/Projects/postcare/docs/DEPENDENCY_REVIEW.md).
- Contributor and AI-agent rules live in [AGENTS.md](/Users/ashwaryjharbade/Projects/postcare/AGENTS.md).

## Planned Stack
- `React`
- `TypeScript`
- `Vite`
- `IndexedDB` via `Dexie`
- manual service worker and web app manifest
- `Vitest`, `Testing Library`, and `Playwright`
- `Semgrep`, `gitleaks`, and `npm audit` for open-source security checks

## Development Workflow
Until dependencies are installed, repository work is documentation-first. After the app is scaffolded, the standard command surface should be:

- `npm install` to install reviewed dependencies
- `npm run dev` to run the local app
- `npm run build` to produce a production build
- `npm run test` to run unit tests
- `npm run lint` to run lint checks
- `npm run security:all` to run dependency, secret, and static security checks

## Security Rules
- Use only open source, security-reviewed packages and tools.
- Never commit secrets, raw tokens, or sample credentials.
- Redact sensitive values from logs, screenshots, fixtures, exports, and AI prompts.
- Document every new dependency and major architecture decision before adoption.

## Environment Variables
Follow [docs/ENVIRONMENT.md](/Users/ashwaryjharbade/Projects/postcare/docs/ENVIRONMENT.md) for local environment handling. This project should avoid committed or bundled secrets; browser-exposed variables must be documented and non-sensitive.

## Next Setup Steps
- Introduce IndexedDB models and request composer foundations
