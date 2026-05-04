# On Build Complete

Trigger this workflow after implementation for a tracked slice is complete.

## Response

1. Run the relevant validation path, typically `lint`, `typecheck`, and targeted tests.
2. Run `/review` or follow `.codex/commands/review.md`.
3. Confirm docs and tracker updates match the delivered behavior.
4. If the feature JSON exists, update status, notes, and remaining follow-up items.
