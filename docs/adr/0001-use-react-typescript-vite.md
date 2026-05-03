# ADR 0001: Use React, TypeScript, and Vite

## Status
Accepted

## Context
The project needs a fast local development loop, strong typing, and a maintainable frontend stack for a complex client-only PWA.

## Decision
Use `React` for UI composition, `TypeScript` for type safety, and `Vite` for fast development and build tooling.

## Consequences
- The project gets a mature component model and strong ecosystem support.
- Type-safe schemas and feature boundaries are easier to enforce.
- Additional tooling must be chosen to support PWA behavior, testing, and security checks.
