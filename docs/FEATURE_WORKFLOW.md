# Feature Workflow

Use this guide to build a Postcare feature end to end with the repo's current Codex workflow.

## Purpose

This repo uses a tracked feature flow:

1. Plan the feature in `docs/features/<slug>.json`
2. Implement the smallest approved slice
3. Add or update automated tests
4. Run validation commands
5. Review the change
6. Update tracking docs

`docs/TRACKER.md` is the live status board. `docs/features/<slug>.json` is the source of truth for an individual feature.

## Before You Start

Read these files before substantial feature work:

- `AGENTS.md`
- `docs/TRACKER.md`
- `docs/PROJECT_PLAN.md`
- `docs/ACCEPTANCE_CRITERIA.md` for user-facing behavior
- The relevant `docs/features/<slug>.json` if it already exists

If the feature is new, create a new feature file first.

## Exact End-to-End Flow

### 1. Create or update the feature plan

Create `docs/features/<slug>.json` using the existing schema shown in `docs/features/curl-import-quick-testing.json`.

Include:

- `id`, `title`, `status`, `priority`, `source`, `createdOn`
- `summary`, `userValue`, `problemStatement`
- `scope`
- `acceptanceCriteria`
- `securityConsiderations`
- `testPlan`
- `documentationUpdates`
- `impactedAreas`
- `notes`

Set the initial status to something like `proposed`, `planned`, or `in-progress` based on the current state.

Update `docs/TRACKER.md` when the feature starts.

### 2. Implement the smallest approved slice

Do not try to deliver the whole feature if it is large. Pick the next reviewable slice from the feature JSON and implement only that.

While implementing:

- Keep changes local to the impacted areas
- Reuse existing patterns
- Do not modify unrelated files
- Do not introduce secrets into code, docs, fixtures, prompts, or logs

Update the feature JSON notes or status if the implementation changes scope or reveals new constraints.

### 3. Add or update tests

Every non-doc feature change should come with automated coverage.

Prefer:

- Unit tests for parsing, helpers, and business logic
- Integration or UI tests for visible user flows
- Accessibility, offline, migration, or security-sensitive coverage when relevant

Record any remaining test gaps in the feature JSON if they cannot be closed in the same slice.

### 4. Run validation commands

Run the narrowest relevant checks first, then broaden.

Core commands:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Development commands:

```bash
npm run dev
npm run preview
npm run test:watch
```

Security commands:

```bash
npm run security:audit
npm run security:secrets
npm run security:static
npm run security:all
```

Recommended command order for a normal feature slice:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

For a security-sensitive change, also run:

```bash
npm run security:all
```

### 5. Review the change

Perform a review pass after the implementation and validation pass.

Review for:

- correctness
- regression risk
- security issues
- missing tests
- architecture drift
- documentation drift

If you find issues, fix them and rerun the relevant checks before marking the slice complete.

### 6. Close out tracking docs

Before considering the feature slice done:

- update `docs/features/<slug>.json`
- update `docs/TRACKER.md`
- update user-facing docs if behavior changed

If the feature is only partially complete, say so clearly in the feature JSON and tracker.

## How To Use Codex Commands

This repo defines four local Codex command prompts in `.codex/commands/`:

- `/feature`
- `/build`
- `/test`
- `/review`

Use them in this order for most work:

1. `/feature` to create or refine `docs/features/<slug>.json`
2. `/build` to implement the next approved slice
3. `/test` to add or expand validation
4. `/review` to do a findings-first review pass

Example feature workflow in Codex:

```text
/feature Add a pasted cURL import flow for the request composer. Create or update the feature JSON and define the first implementation slice.
```

```text
/build Implement the first approved slice for docs/features/curl-import-quick-testing.json.
```

```text
/test Add or update coverage for the cURL import slice and run the relevant checks.
```

```text
/review Review the cURL import slice against the feature JSON and current branch changes.
```

## Exact Prompt Sequence To Build A Feature

Use these prompt patterns when you want Codex to take a feature from requirement to implementation using the repo flow.

### Step 1: Turn the requirement into a tracked feature

Paste this and replace the bracketed values:

```text
/feature
Create a new tracked feature from this requirement:

[PASTE REQUIREMENT]

Instructions:
- Create or update docs/features/[slug].json
- Read AGENTS.md, docs/TRACKER.md, docs/PROJECT_PLAN.md, and docs/ACCEPTANCE_CRITERIA.md first
- Capture assumptions explicitly
- Define scope, acceptance criteria, security considerations, test plan, documentation updates, impacted areas, and notes
- Propose the first small implementation slice
- Update docs/TRACKER.md to reflect that this feature has started
```

### Step 2: Implement the first approved slice

After the feature JSON exists, use:

```text
/build
Implement the first approved slice for docs/features/[slug].json.

Instructions:
- Read AGENTS.md, docs/TRACKER.md, and the feature JSON first
- Use the repo feature workflow
- Implement only the smallest reviewable slice
- Keep the change local to the impacted areas
- Add or update tests with the code change
- Update the feature JSON notes and status if needed
- Update docs/TRACKER.md if progress materially changes
```

### Step 3: Expand or run validation

Use this after the build step:

```text
/test
Validate the implemented slice for docs/features/[slug].json.

Instructions:
- Read the feature JSON and changed files first
- Add any missing regression coverage
- Run the relevant commands
- Start with the narrowest useful checks, then broaden
- Fix failures if they are part of the implemented slice
- Record any remaining blocker or gap in the feature JSON
```

### Step 4: Run a review pass

Use this after tests are green or after the main fix set is done:

```text
/review
Review the implemented slice for docs/features/[slug].json.

Instructions:
- Review for correctness, regressions, security issues, architecture drift, and missing tests
- Report findings first, ordered by severity, with file references
- If there are no findings, say so explicitly and mention any residual risks or test gaps
- Check that docs/TRACKER.md and the feature JSON match the delivered behavior
```

### Step 5: Ask for the next slice

If the feature is large, continue in slices:

```text
/build
Read docs/features/[slug].json and implement the next approved slice.

Instructions:
- Do not reopen requirements unless the code revealed a real gap
- Reuse the same feature JSON
- Keep the slice reviewable
- Add or update tests
- Update docs and tracker state
```

## One-Prompt End-To-End Option

If you want Codex to run the whole flow in one request, use this:

```text
Use the Postcare feature workflow to take this requirement from planning to a completed first slice:

[PASTE REQUIREMENT]

Instructions:
- Read AGENTS.md, docs/TRACKER.md, docs/PROJECT_PLAN.md, and docs/ACCEPTANCE_CRITERIA.md first
- Create or update docs/features/[slug].json
- Define assumptions, scope, acceptance criteria, security considerations, test plan, documentation updates, impacted areas, and notes
- Implement the first small approved slice
- Add or update automated tests
- Run the relevant validation commands
- Review the result
- Update docs/TRACKER.md and the feature JSON before finishing
- Keep the work incremental and do not expand scope beyond the first slice
```

## Prompt Variants

### Requirement only

Use this when you only want planning:

```text
/feature
Turn this requirement into a tracked feature JSON and stop after planning:

[PASTE REQUIREMENT]
```

### Requirement plus implementation

Use this when the requirement is already clear and you want Codex to plan and build immediately:

```text
Use the Postcare feature workflow.

Requirement:
[PASTE REQUIREMENT]

Plan the feature in docs/features/[slug].json, then implement the first approved slice, add tests, run validation, and update docs/TRACKER.md.
```

### Existing feature JSON

Use this when the feature has already been planned:

```text
/build
Read docs/features/[slug].json and implement the next approved slice with tests and tracker updates.
```

## How Skills Fit In

This repo already includes two relevant skills:

- `$postcare-feature-workflow`
- `$postcare-testing`

### `$postcare-feature-workflow`

Use this for plan/build/test/review work tied to a tracked feature. It tells Codex to:

- read the repo guidance docs first
- treat `docs/features/<slug>.json` as the feature source of truth
- keep work traceable and incremental
- update `docs/TRACKER.md` as work progresses

### `$postcare-testing`

Use this when the task is mainly about test coverage or failure triage. It tells Codex to:

- prefer deterministic tests
- add regression coverage
- include accessibility, offline, and migration testing when relevant
- run the repo validation commands in a sensible order

## How Hooks Fit In

Hooks are configured in `.codex/hooks.json`.

### PostToolUse hook

After shell commands run, Codex executes:

- `.codex/hooks/test_failure_followup.py`

Purpose:

- detect failed test/build-style commands
- trigger a follow-up workflow when validation fails

Supporting doc:

- `.codex/hooks/on-test-failure.md`

Expected response to a failed validation command:

1. capture the failing command
2. inspect the smallest useful failure output
3. classify the failure
4. fix behavior or tests
5. rerun the relevant checks
6. update the feature JSON or tracker if delivery status changed

### Stop hook

When a run is stopping, Codex executes:

- `.codex/hooks/build_complete_review.py`

Purpose:

- check whether validation or review still appears to be missing

Supporting doc:

- `.codex/hooks/on-build-complete.md`

Expected response after implementation:

1. run validation if still needed
2. run `/review`
3. confirm docs and tracker updates
4. update the feature JSON status and notes

## How Subagents Fit In

This repo supports project-scoped custom agents in `.codex/agents/*.toml`.

Available agents:

- `product-manager`
- `architect`
- `developer`
- `qa`
- `reviewer`

Important repo rule:

- use subagents only when the user explicitly asks for delegation or parallel agent work

That means subagents are available, but they are not the default path for normal feature development.

### When to use each subagent

- `product-manager`: refine requirements, assumptions, and acceptance criteria
- `architect`: review data flow, module boundaries, and implementation risks
- `developer`: implement a bounded code slice
- `qa`: add tests, isolate failures, and identify coverage gaps
- `reviewer`: run a focused review for bugs, regressions, and missing tests

### Example delegated workflow

Only use this pattern if the user explicitly asks for delegation:

1. Ask `product-manager` to refine the feature JSON
2. Ask `architect` to review the proposed design
3. Ask `developer` to implement a bounded slice
4. Ask `qa` to add tests for a disjoint file set
5. Ask `reviewer` to perform a findings-first review

Keep file ownership clear when more than one agent writes code.

## Daily Command Reference

### Local development

```bash
npm install
npm run dev
```

### Validation

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

### Security

```bash
npm run security:all
```

### Production preview

```bash
npm run build
npm run preview
```

## Minimum Definition Of Done

A feature slice is not done until all of the following are true:

- the feature JSON is created or updated
- implementation is complete for the approved slice
- tests are added or updated
- relevant commands pass
- review is completed
- `docs/TRACKER.md` is updated
- behavior and documentation match
