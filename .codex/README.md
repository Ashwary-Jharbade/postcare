# Codex Workflow

This directory converts the legacy [`ai/`](../ai) prompt set into repo-local Codex assets.

## Layout

- `commands/` holds slash-command prompt files for the plan/build/test/review loop.
- `skills/` holds reusable repo-specific workflow guidance.
- `agents/` holds TOML custom subagent definitions for focused delegation.
- `hooks/` holds executable hook scripts plus the original trigger-specific follow-up notes.

## Source Mapping

- `ai/commands/*` -> `.codex/commands/*`
- `ai/skills/testing.md` -> `.codex/skills/postcare-testing/`
- `ai/agents/*` -> `.codex/agents/*.toml`
- `ai/hooks/*` -> `.codex/hooks/*` plus live hook wiring in `.codex/hooks.json`
- `ai/rules/global.md` -> folded into the skills and commands

## Repo Conventions

- Use `docs/features/<slug>.json` as the feature tracking artifact instead of a root-level `feature.json`.
- Keep `docs/TRACKER.md` updated when work starts or completes.
- Read `AGENTS.md` and relevant docs before major implementation work.
