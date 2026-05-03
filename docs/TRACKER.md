# Project Tracker

Use this checklist as the single task tracker for humans and AI agents. Mark items complete only after code, tests, and docs are updated together.

## Completed
- [x] Initial product requirements captured in [docs/PROJECT_PLAN.md](/Users/ashwaryjharbade/Projects/postcare/docs/PROJECT_PLAN.md)
- [x] Contributor guide created in [AGENTS.md](/Users/ashwaryjharbade/Projects/postcare/AGENTS.md)
- [x] Open-source-only and secure-tooling rule added to project planning
- [x] Initial phased delivery plan defined
- [x] `README.md` created with setup, workflow, and security rules
- [x] Baseline docs created: architecture, security, roadmap, ADR, and templates
- [x] Frontend scaffold created with `React`, `TypeScript`, and `Vite`
- [x] Initial commands validated: install, lint, type-check, and build
- [x] Manual PWA baseline added with manifest and service worker
- [x] Initial Vitest setup and baseline UI test added
- [x] Dependency auditing wired through `npm audit` with a clean result
- [x] CI workflow added for lint, type-check, test, build, and dependency audit
- [x] Security workflow added for gitleaks and Semgrep
- [x] Local environment variable policy documented
- [x] Core storage schema implemented for requests, collections, environments, history, secrets, and settings
- [x] IndexedDB bootstrap and storage summary view added for requirement-development verification
- [x] Request composer added for method, URL, headers, query params, and body editing with local persistence
- [x] Auth editing, request execution, response inspection, and history persistence added for the primary request workflow
- [x] Diff highlighting added for response headers, payload lines, and JSON structure changes
- [x] Mock delays, simulated failures, and edge-case response modes added to request execution
- [x] Execution logs, trace IDs, and diagnostics summary added for request runs
- [x] AI-assisted suggestion panel added with redacted request context safeguards
- [x] Acceptance criteria baseline documented for major feature areas
- [x] Accessibility, offline, and migration test coverage added
- [x] Direct dependencies reviewed against open-source and security policy
- [x] OpenAI docs-inspired UI style system applied and documented

## Pending: Project Setup
- [x] Create `README.md` with local setup, scope, and development workflow
- [x] Scaffold frontend app with `React`, `TypeScript`, and `Vite`
- [x] Add PWA support with offline shell and installability
- [x] Configure linting, formatting, type-checking, and test commands
- [x] Configure secret scanning and static security checks
- [x] Define environment variable policy for local development

## Pending: Documentation
- [x] Create `docs/ARCHITECTURE.md`
- [x] Create `docs/SECURITY.md`
- [x] Create `docs/ROADMAP.md`
- [x] Create `docs/adr/` with initial architecture decision records
- [x] Create templates for feature specs, threat models, and bug reports

## Pending: Core Product
- [x] Define storage schema for requests, collections, environments, history, and secrets
- [x] Build request composer with methods, headers, params, and body editors
- [x] Add auth modes: API key, Bearer, Basic, OAuth2
- [x] Build collection and request list management UI — create/rename/delete collections and requests
- [x] Save multiple requests within collections with local persistence
- [x] Build environment list management UI — create/rename/delete environments
- [x] Add environment variables management (public and secret variables per environment)
- [x] Display active environment selection with visual indicator
- [x] Build response viewer with tabbed interface: pretty, raw, and HTML preview modes
- [x] Display response status, timing, headers, and body with improved formatting
- [x] Add variable substitution in URLs, headers, and body ({{variable}} syntax)
- [x] Bind request execution to active environment and scoped variables
- [x] Add import and export for collections and requests
- [x] Add request code generation for `cURL`, `fetch`, `axios`, and Python

## Pending: Advanced Features
- [x] Add response comparison across environments
- [x] Add diff highlighting for headers, payloads, and structure
- [x] Add mock delays, failures, and edge-case simulation
- [x] Add logs, tracing, and error diagnostics
- [x] Add AI-assisted edge-case generation and request improvement with redaction safeguards

## Pending: Quality Gates
- [x] Define acceptance criteria for each major feature before implementation
- [x] Enforce PR checks for lint, type-check, tests, and security scans
- [x] Add accessibility, offline, and migration test coverage
- [x] Review all dependencies against the open-source and security policy
