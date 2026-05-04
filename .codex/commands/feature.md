# /feature

Use this command to create or revise a feature planning artifact in `docs/features/<slug>.json`.

## Workflow

1. Read `AGENTS.md`, `docs/TRACKER.md`, `docs/PROJECT_PLAN.md`, `docs/ACCEPTANCE_CRITERIA.md`, and any relevant files for the requested area.
2. Use the repo skill `$postcare-feature-workflow`.
3. If the request is ambiguous, capture assumptions explicitly instead of inventing missing product decisions.
4. Produce or update a single `docs/features/<slug>.json` file using the existing feature JSON style already present in `docs/features/`.
5. Include scope, acceptance criteria, security considerations, test plan, documentation updates, and impacted areas.
6. Update `docs/TRACKER.md` when the feature is newly started.

## Guardrails

- Do not write implementation code in this step.
- Do not begin requirement development after setup milestones unless the user explicitly asked for it.
- Keep the plan small enough to implement and review incrementally.

## Suggested Delegation

- Use `.codex/agents/product-manager.toml` for requirement refinement.
- Use `.codex/agents/architect.toml` for architecture and data-flow review.
