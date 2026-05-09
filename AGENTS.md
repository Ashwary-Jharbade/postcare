# Postcare: Local-First API Client

Postcare is a privacy-focused, offline-capable API client built for developers. It prioritizes local storage and security, ensuring that sensitive request data never leaves the user's device unless explicitly intended.

## 🚀 Quick Start

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm run test`
- **Lint:** `npm run lint`
- **Type-Check:** `npm run typecheck`
- **Security Check:** `npm run security:all`

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Storage:** IndexedDB via [Dexie.js](https://dexie.org/)
- **Styling:** Vanilla CSS with design tokens
- **Testing:** Vitest + Testing Library
- **Security:** `gitleaks`, `Semgrep`, `npm audit`

## 🏗 Architecture & Directory Structure

The project follows a feature-based organization combined with a core library for business logic.

- `src/domain/`: Core data models and type definitions (`models.ts`).
- `src/features/`: High-level feature modules (UI + logic).
  - `collections/`: Management of request groups and import/export.
  - `environments/`: Environment variables and substitution UI.
  - `requests/`: Request Composer, execution logic, and diagnostics.
- `src/lib/`: Reusable, logic-heavy utilities.
  - `ai/`: AI assistant integration with secret redaction.
  - `variables/`: The `{{variable}}` substitution engine.
  - `storage/`: Dexie database schema and migrations.
  - `codegen/`: Snippet generation (cURL, Fetch, etc.).
- `src/components/` & `src/hooks/`: Shared UI primitives and React hooks.
- `docs/`: Project planning, feature workflows, and ADRs.

## ⚖️ Development Conventions

### Coding Style
- **TypeScript First:** Maintain strict type safety. Avoid `any`.
- **Vanilla CSS:** Use CSS variables (design tokens) found in `src/styles.css`.
- **Functional Components:** Use React 19 patterns and hooks.
- **Atomic Commits:** Keep changes focused and prefixed (e.g., `feat:`, `fix:`, `test:`).

### Testing & Quality
- **Unit Testing:** Mandatory for new logic in `src/lib` and `src/features`.
- **Empirical Reproduction:** Always reproduce bugs with a test case before fixing.
- **Security First:** Never log raw secrets. Use `src/lib/redaction` for safe logging/AI flows.

### Feature Workflow
For end-to-end development instructions, refer to `docs/FEATURE_WORKFLOW.md`. It covers planning, implementation, and validation sequences.

## 🔒 Security Mandates
- **Local-Only:** No cloud syncing or telemetry. Data must persist in IndexedDB.
- **Secret Masking:** Variables marked as 'secret' must be masked in the UI.
- **Redaction:** Before sending any data to AI providers, use the redaction engine to strip sensitive values.
