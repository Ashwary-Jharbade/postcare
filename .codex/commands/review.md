# /review

Use this command for a code-review style pass over a completed change or feature slice.

## Workflow

1. Read the relevant feature JSON, changed files, and tests.
2. Review for correctness, regressions, security, performance, architecture consistency, and missing tests.
3. Report findings first, ordered by severity, with concrete file references.
4. If no findings are present, state that explicitly and mention residual risks or test gaps.
5. Update the feature JSON review notes when the workflow is feature-tracked.

## Guardrails

- Treat this as a review pass, not a rewrite pass.
- Focus on defects and risks before style commentary.
- Check that docs and tracker updates match the code change.

## Suggested Delegation

- Use `.codex/agents/reviewer.toml` for a dedicated review brief.
- Use `.codex/hooks/on-build-complete.md` after implementation is done.
