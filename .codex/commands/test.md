# /test

Use this command to expand and run validation for an implemented feature.

## Workflow

1. Read `AGENTS.md`, the relevant `docs/features/<slug>.json` if it exists, and the changed source files.
2. Use `$postcare-testing`.
3. Add missing unit, integration, accessibility, offline, or migration coverage as needed for the touched area.
4. Run the relevant automated test commands.
5. If failures appear, fix them or record a clear blocker in the feature JSON and tracker.

## Guardrails

- Prefer deterministic tests.
- Cover regressions introduced by the change, not just the happy path.
- Respect the repo security rule: never leak secrets into fixtures, logs, or prompts.

## Suggested Delegation

- Use `.codex/agents/qa.toml` for targeted test generation or coverage analysis.
- Use `.codex/hooks/on-test-failure.md` after a failed run.
