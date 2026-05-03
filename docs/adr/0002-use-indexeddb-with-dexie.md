# ADR 0002: Use IndexedDB with Dexie for Local Persistence

## Status
Accepted

## Context
The product is client-only and must store requests, collections, environments, history, and secrets locally without a backend. The storage layer also needs versioned schema control and predictable table access as features grow.

## Decision
Use browser `IndexedDB` as the primary local store and `Dexie` as the typed access layer. Keep secrets in a separate table from general request metadata and maintain explicit schema versions.

## Consequences
- Large local datasets and offline-first workflows are practical without server support.
- Schema evolution can be handled through Dexie version upgrades.
- Storage contracts must remain explicit and documented before UI workflows expand.
