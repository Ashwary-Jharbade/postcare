# AI-Native API Client PWA: Requirements and Delivery Plan

## Project Goal
Build a Postman-like Progressive Web App (PWA) with AI-assisted features that runs fully on the client, works offline where feasible, and stores user data locally without requiring a backend or login.

## Product Principles
- Local-first: requests, collections, environments, and settings stay on the device unless the user explicitly imports or exports files.
- Secure-by-default: no secret syncing, no hidden telemetry, no accidental key exposure, and strong client-side storage hygiene.
- Postman-grade core workflows: request building, collections, auth, environments, response analysis, and import/export must feel complete before adding advanced AI features.
- AI with guardrails: AI features must be explicit, reviewable, and never auto-send secrets or private payloads without user confirmation.
- Open-source-only dependency policy: all frameworks, packages, AI helpers, build tools, and security tooling used by this project must be open source, actively maintained, and reviewed before adoption.

## Core Functional Requirements
### Request Builder
- Support `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`.
- Support headers, query params, path params, and body editors for JSON, text, form-data, and raw payloads.
- Auto-manage derived headers such as `Content-Type` where safe.

### Collections and Environments
- Create, edit, organize, duplicate, import, and export collections locally.
- Support multiple environments with scoped variables and request overrides.
- Save requests per environment and allow fast environment switching.

### Auth and Responses
- Support API Key, Bearer, Basic, and OAuth2.
- Provide response views for pretty, raw, and preview.
- Show request timing details such as total time and browser-available network phases.

### Advanced Analysis
- Convert requests to `cURL`, `fetch`, `axios`, and Python.
- Compare responses across environments by status, latency, headers, payload, URL, and structure.
- Highlight diffs clearly.
- Simulate delays, failures, and edge cases.
- Provide logs, validation errors, and request tracing.

### AI Features
- Generate edge cases and test payload variants.
- Suggest headers, params, and request fixes.
- Explain response errors and schema mismatches.
- AI actions must require explicit user review before applying.

## Non-Functional Requirements
- No backend and no login.
- PWA installable, offline-capable shell, and resilient local caching.
- Robust local data model with versioned migrations.
- Accessible, fast, and easy-to-use UI.
- Strong documentation for humans and AI agents.

## Recommended Tech Stack
- `React + TypeScript` for maintainable UI and type safety.
- `Vite` for fast local development.
- `Tailwind CSS` or `CSS Modules` for a controlled design system.
- `IndexedDB` via `Dexie` for collections, environments, history, and settings.
- `Monaco Editor` for rich request and response editing.
- `MSW` for request mocking and failure simulation.
- manual service worker and web app manifest support, or another vetted open source offline approach that passes security review.
- `Zod` for schema validation and versioned data contracts.
- `Vitest + Testing Library + Playwright` for unit, integration, and end-to-end coverage.
- `ESLint`, `Prettier`, `npm audit`, `Semgrep`, and `gitleaks` for quality and security checks using open source tooling.

## Security Standards
- Use only open source, security-reviewed dependencies with permissive licenses and active maintenance.
- Record package justification, version pinning strategy, and replacement plan for every critical dependency.
- Encrypt sensitive local values where practical; at minimum segregate secrets from general settings.
- Never log tokens, secrets, or authorization headers in plaintext.
- Add explicit secret-redaction utilities across UI, storage, exports, traces, and AI prompts.
- Restrict AI context so secrets, private payloads, and auth headers are excluded by default.
- Define CSP, dependency review, secure storage rules, and import validation from the start.

## AI-Aided Development Rules
- Maintain architecture docs, ADRs, schemas, and feature specs before major coding begins.
- Keep small, test-backed tasks so AI-generated changes are easy to review.
- Require lint, type-check, unit tests, and security checks on every PR.
- Use templates for feature specs, threat models, and acceptance criteria.
- Record assumptions and unresolved questions in docs, not only in chat.
- Use Codex for repo-wide code search, doc generation, refactor support, test creation, review checklists, and implementation of tightly scoped tasks.
- Keep Codex work auditable: every AI-generated change must map to a documented task, acceptance criteria, and verification result.
- Prefer Codex-assisted patches over large unreviewed generations; smaller tasks reduce security and architecture drift.

## Codex Workflow Recommendations
- Use `AGENTS.md` as the persistent contributor and AI-agent operating contract.
- Maintain a live checklist in `docs/TRACKER.md` so Codex can pick up the next verified task without ambiguity.
- Add ADRs under `docs/adr/` for stack, storage, security, and AI-boundary decisions.
- Add reusable task templates for feature specs, threat models, and bug reports to reduce prompt variance.
- Use Codex for review passes focused on regressions, security leaks, missing tests, and documentation drift before merge.

## Delivery Plan
### Phase 1: Foundations
- Finalize stack, folder structure, design system, storage schema, and PWA shell.
- Define request, collection, environment, and secret models.
- Establish CI, linting, testing, coverage, dependency review, and secret scanning.
- Create baseline docs: architecture, security, ADRs, checklist, and contribution workflow.

### Phase 2: Core Client
- Build request composer, auth, response viewer, collections, environments, and import/export.
- Add local persistence, history, and code generation.

### Phase 3: Analysis and Simulation
- Add comparison tooling, diff highlighting, mock behaviors, logs, and tracing.

### Phase 4: AI Layer
- Add guarded AI workflows for edge-case generation, error explanation, and request improvement.

### Phase 5: Hardening
- Offline verification, performance tuning, migration tests, accessibility review, and security audit.

## Open Decisions
- Confirm the final design system approach.
- Decide whether OAuth2 flows are fully browser-based or partially constrained by local-only limits.
- Define which AI provider and what local redaction boundary will be used.
- Finalize the package approval checklist for the open-source-only dependency policy.
