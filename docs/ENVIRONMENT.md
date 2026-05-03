# Local Environment Policy

## Rules
- This project is client-only. Do not add backend credentials, database URLs, or cloud service secrets to local environment files.
- Prefer checked-in defaults only for non-sensitive values such as feature flags, app name, or documentation examples.
- Treat API keys, OAuth client secrets, bearer tokens, cookie values, and imported environment variables as sensitive.
- Never commit `.env`, `.env.local`, `.env.*`, or files containing real credentials.

## Allowed Usage
- Use environment variables only for local developer convenience and build-time configuration that does not expose secrets to the shipped client.
- Prefix browser-exposed variables according to the build tool contract, and document every variable in `README.md` before use.
- If a value must remain secret, it must not be bundled into the frontend. For this project, sensitive runtime values should come from user input and local storage, not from committed env files.

## Required Files
- Keep a checked-in `.env.example` only when variables actually exist.
- Populate `.env.example` with placeholders, never real values.
- Document purpose, default behavior, and sensitivity for each variable.

## Review Checklist
- Is the variable safe to expose to browser code?
- Is the variable documented in `README.md`?
- Is there a non-env alternative for this value?
- Has the change been reviewed for accidental secret leakage?
