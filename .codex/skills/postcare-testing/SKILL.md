---
name: postcare-testing
description: Use when adding or reviewing automated coverage in Postcare, especially for unit, integration, accessibility, offline, migration, and security-sensitive request flows.
---

# Postcare Testing

Use this skill when the task is primarily about test coverage, validation, or failure triage.

## Expectations

- Cover new behavior and regressions introduced by each change.
- Prefer deterministic unit and integration tests.
- Include accessibility, offline, or migration coverage when the touched feature affects those platform guarantees.
- Mock external behavior carefully and never leak secrets into fixtures or failure logs.

## Repo Commands

Run the smallest relevant checks first, then broaden if needed:

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Failure Triage

1. Reproduce the failure with the narrowest command possible.
2. Determine whether the issue is a bad test, a real regression, or a setup problem.
3. Fix behavior first when the failure reveals a real defect.
4. Re-run the affected checks and record any remaining gaps.
