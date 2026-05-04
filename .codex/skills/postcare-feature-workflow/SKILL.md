---
name: postcare-feature-workflow
description: Use when planning or implementing a Postcare feature with a tracked workflow, especially when work should be recorded in docs/features JSON files, docs/TRACKER.md, and repo-specific docs before code changes.
---

# Postcare Feature Workflow

Use this skill for the repo's plan/build/test/review loop.

## Read First

Before substantial work, read:

- `AGENTS.md`
- `docs/TRACKER.md`
- `docs/PROJECT_PLAN.md`
- `docs/ACCEPTANCE_CRITERIA.md` when behavior is user-facing
- The relevant `docs/features/<slug>.json` if one exists

## Source of Truth

This repo does not use a root `feature.json`.

Use `docs/features/<slug>.json` as the tracked feature artifact. Follow the shape already used in `docs/features/curl-import-quick-testing.json`:

- `id`, `title`, `status`, `priority`, `source`, `createdOn`
- user problem framing such as `summary`, `userValue`, `problemStatement`
- `scope`, `acceptanceCriteria`, `securityConsiderations`, `testPlan`
- `documentationUpdates`, `impactedAreas`, `notes`

Prefer extending that schema consistently over inventing a new one.

## Workflow

1. Plan: refine the request, document assumptions, define acceptance criteria, and write or update the feature JSON.
2. Build: implement the smallest approved slice and keep the change local to the impacted areas.
3. Test: add or update automated coverage and run the relevant commands.
4. Review: perform a findings-first review pass before considering the slice complete.
5. Track: update `docs/TRACKER.md` whenever work starts, shifts materially, or completes.

## Repo Rules

- Do not begin new requirement development after setup milestones unless the user explicitly approves that transition.
- Keep work traceable to a checklist item or documented task.
- Never commit secrets or raw auth values into code, docs, fixtures, screenshots, or prompts.
- Prefer open-source-only dependencies and document any new dependency rationale.

## Delegation

Use sub-agents only when the user explicitly asks for delegation or parallel agent work.

- Planning and architecture questions map well to read-only exploration.
- Implementation and test-writing map well to worker agents when file ownership is clear.
- Keep delegated tasks small and assign explicit file responsibility.
