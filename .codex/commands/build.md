# /build

Use this command to implement an approved or clearly requested feature tracked in `docs/features/<slug>.json`.

## Workflow

1. Read `AGENTS.md`, `docs/TRACKER.md`, and the target feature JSON.
2. Use `$postcare-feature-workflow`.
3. Implement only the next scoped slice or approved set of tasks.
4. Add or update tests with the code change.
5. Update the feature JSON status, notes, and implementation progress if the file exists.
6. Update `docs/TRACKER.md` when a tracked item moves forward or completes.

## Guardrails

- Do not modify unrelated files.
- Reuse existing patterns in `src/`, `tests/`, and `docs/`.
- Keep changes reviewable and reversible.

## Suggested Delegation

- Use `.codex/agents/developer.toml` for implementation-heavy slices.
- Use `.codex/agents/qa.toml` for disjoint test work when parallelization is safe.
