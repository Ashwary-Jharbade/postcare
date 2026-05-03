# Repository Guidelines

## Project Structure & Module Organization
This repository is currently in setup. Keep the root minimal and organize work so both humans and AI agents can navigate it quickly:

- `src/` for application code
- `tests/` for automated tests
- `docs/` for design notes and operational runbooks
- `docs/adr/` for architecture decision records
- `docs/templates/` for reusable spec, threat-model, and bug-report templates
- `assets/` for static files such as images or fixtures

Prefer feature-based grouping inside `src/` (for example, `src/auth/` or `src/posts/`) over large utility dumps.
Use [docs/TRACKER.md](/Users/ashwaryjharbade/Projects/postcare/docs/TRACKER.md) as the live status board for completed and pending work.

## Build, Test, and Development Commands
There are no standard project commands defined yet. When introducing a runtime or framework, add the primary developer commands to the repository root config and document them in `README.md`.

Expected command shape:

- `make dev` or `npm run dev` for local development
- `make test` or `npm test` for the full test suite
- `make lint` or `npm run lint` for static checks
- `make build` or `npm run build` for production artifacts

Choose one command surface and keep it consistent. Every new setup step must also be reflected in `docs/PROJECT_PLAN.md` or `README.md`.

## Coding Style & Naming Conventions
Use 2 spaces for Markdown, YAML, JSON, and frontend assets; use 4 spaces for Python if Python is added. Prefer descriptive, lowercase directory names and language-idiomatic file names such as `kebab-case.ts`, `snake_case.py`, or `PascalCase.tsx` for React components.

Adopt a formatter and linter early and run them before opening a PR. Typical choices are Prettier and ESLint for JavaScript/TypeScript or Ruff for Python. Keep schemas, storage models, and security-sensitive utilities strongly typed and documented.

## Testing Guidelines
Place tests under `tests/` or beside source files using the framework’s standard pattern, such as `*.test.ts` or `test_*.py`. Cover new behavior and regressions introduced by each change. Do not merge features without automated tests unless the change is purely documentation or repository metadata.

Include security, migration, and offline behavior tests for platform-level features. AI-generated code must be verified with the same test standards as hand-written code.

## Security & Dependency Rules
This project has a strict open-source-only dependency rule. Use only open source packages and tools with active maintenance, acceptable licenses, and clear security posture.

Never commit secrets, sample tokens, or raw authorization headers. Redact sensitive values in logs, exports, test fixtures, screenshots, and AI prompts. Any new dependency should be justified in docs and reviewed for security impact before adoption.

## AI-Agent Workflow
Document architecture, acceptance criteria, and constraints before major implementation work. Keep tasks small so AI-generated changes are reviewable, testable, and reversible.

Use Codex for implementation, repo search, refactors, review passes, and documentation upkeep, but keep every change traceable to a checklist item or documented task. Update `docs/TRACKER.md` whenever work is started or completed.
Do not begin requirement development after setup milestones are complete until the user explicitly approves that transition.

## Commit & Pull Request Guidelines
There is no commit history yet, so use imperative, scoped commit messages such as `feat: add post scheduling model` or `docs: add contributor guide`. Keep commits focused.

Pull requests should include a short summary, testing notes, linked issues, and documentation updates when applicable. Add screenshots or sample output for UI or CLI changes. If you introduce new tooling, document setup steps, security considerations, and package rationale in the PR and update this guide once the convention is settled.
