[POS-1] Sync request list names and validate composer name

## Summary

This PR fixes a "split brain" synchronization issue where renaming a request in the composer didn't automatically update the sidebar list, leaving it with a stale name. It also fixes an issue where the composer allowed saving empty or whitespace-only names on every keystroke, which could lead to blank titles and was inconsistent with sidebar validation rules. The list now reacts automatically to IndexedDB updates, and the composer correctly trims input, rejects empty names at the persistence layer, and reverts abandoned empty edits back to the previous name upon blur.

## Type

- [ ] Feature
- [x] Bugfix
- [ ] Chore / refactor
- [ ] Docs-only

## Linked tickets

- POS-1

## Implementation highlights

- **Reactive Sidebar List**: Refactored `useCollectionRequests` to use Dexie's `liveQuery` so the request list automatically updates when a request's name is saved.
- **Strict Name Validation**: Hardened `setName` in `useRequestComposer` and `usePrimaryRequestComposer` to trim names and return early if the string is empty or whitespace-only, preventing persistence of invalid names.
- **Local Draft State**: Refactored `RequestComposer` to use a local `nameDraft` state for the input. On blur, the draft is trimmed and saved. If the input is empty, an inline error is displayed and the draft reverts to the last valid name.

## Steps to reproduce (before)

1. Open a request in the composer and start editing its name.
2. Note that the new name is saved, but the sidebar list retains the old name until you switch collections.
3. Clear the entire name field. The application permits you to save an entirely blank title.

## Testing

1. Run the test suite via `npm run test` to verify the added unit and integration tests.
2. Manually verify renaming: Edit a request name in the composer and confirm the sidebar updates instantly.
3. Manually verify validation: Delete the entire request name in the composer and click away (blur). Confirm an inline error message appears and the name reverts to its previous valid state.

## Screenshots & attachments

None attached. _Add screenshots for UI changes or attach exports from the ticket tracker if helpful._

## Notes for reviewers

A redundant `reload` mock was kept in `useCollectionRequests` for backward compatibility, but it does nothing (`Promise.resolve()`) as updates are now reactive via `liveQuery`.
