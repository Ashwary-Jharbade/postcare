# Security Baseline

## Core Rules
- Use only open source, actively maintained, security-reviewed packages and tools.
- Do not add telemetry, cloud sync, or hidden external data transfer.
- Never commit secrets, auth headers, private payloads, or local environment values.

## Sensitive Data Handling
- Treat API keys, bearer tokens, OAuth tokens, cookies, and imported environment secrets as sensitive.
- Redact sensitive values in logs, exports, screenshots, fixtures, and AI context.
- Keep secrets isolated from non-sensitive request metadata where practical.

## Dependency Review
Before adding a package, document:
- purpose
- license
- maintenance status
- known security posture
- removal or replacement fallback

## Application Controls
- Validate imported collections and environment files before saving them.
- Define a Content Security Policy before production release.
- Add secret scanning, dependency auditing, and static analysis to the standard workflow.
- Require security review for storage, auth, AI, and import/export changes.
- Use `npm run security:all` as the local security entry point once supporting tools are installed.
- Enforce CI checks for lint, type-check, test, build, dependency audit, secret scanning, and Semgrep findings.

## AI Boundaries
- Do not send secrets or raw auth data to AI systems by default.
- Require explicit user review before applying AI-generated changes to requests or collections.
- Keep AI prompts narrow, task-specific, and traceable to documented features.
