# On Test Failure

Trigger this workflow after an automated test run fails.

## Response

1. Capture the failing command and the smallest relevant failure output.
2. Classify the failure: broken assertion, environment/setup issue, type error, lint issue, or runtime regression.
3. Use `.codex/agents/qa.toml` to isolate missing coverage or the intended behavior.
4. Use `.codex/agents/developer.toml` to implement the smallest safe fix.
5. Re-run only the relevant checks first, then the broader suite if needed.
6. Update the related feature JSON and `docs/TRACKER.md` if the failure changes delivery status.
