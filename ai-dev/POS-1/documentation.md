# Sync Request List Names and Validate Composer Name

**Ticket:** POS-1
**Last updated:** 2026-05-10
**Branch / PR:** POS-1

---

## In plain English

Previously, renaming a request in the main composer area didn't automatically update the name shown in the left sidebar, which was confusing and left you looking at a stale name. Additionally, it was possible to delete the entire name and save a completely blank title. This update ensures that the sidebar list automatically stays in sync with any edits made in the composer, and it prevents you from accidentally saving a blank request name.

---

## What you can do now

- See request names update instantly in the left sidebar as you rename them in the composer.
- Safely clear the request name input without permanently saving a blank title; it will revert if you click away.

---

## How to try it (manual checks)

1. Open Postcare and select any collection to view its requests.
2. Select a request and click into the "Name" field in the composer.
3. Edit the name and press `Enter` or click away. You should see the name update immediately in the sidebar list.
4. Try to delete the entire name in the composer and click away. An error message "Name cannot be empty" will appear, and the name will revert to what it was before.

---

## What changed under the hood (still readable)

- **Real-time Data Sync:** The sidebar's request list now uses a reactive database query (`liveQuery` from Dexie). It automatically listens to changes in the local database and refreshes the list on its own, instead of requiring manual reload triggers.
- **Strict Validation:** The data persistence layer now explicitly rejects names that are empty or contain only spaces. This means even if a bug in the UI tries to save a blank name, the database layer will safely ignore it.
- **Local Draft State:** The composer's name input now manages its own "draft" state while you are typing. It only attempts to save the new name to the database when you click away from the input (blur) or press `Enter`, rather than saving on every single keystroke.

---

## Risks, limits, and follow-ups

- **Redundant Reload Calls:** Existing components that explicitly asked the list to "reload" will now find that the reload command returns instantly. This is safe, but future cleanups should remove these calls as they are no longer necessary.
- **Existing Blank Names:** This change does not migrate or fix any requests that were *already* saved with a blank name in the past. It only prevents new ones from being created.
