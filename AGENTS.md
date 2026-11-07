# Agent Guidelines & Data Persistence Rules

All AI coding agents working on `habitcorp` MUST strictly follow these rules to prevent accidental data loss in production (`habits.balears.tech` / `habitcorp-app.web.app`):

## 1. Never Bump or Rename `STORAGE_KEY` Without Migration
- Production runs as a static SPA on Firebase Hosting (`dist/client`), persisting user state in browser `localStorage` via `src/client/clientStore.ts`.
- **NEVER** rename or bump `STORAGE_KEY` (`'habitcorp_client_db_v4'`) without keeping all previous keys in `LEGACY_STORAGE_KEYS` and preserving automatic non-destructive migration in `getClientDb()`.
- Changing `STORAGE_KEY` without migration immediately orphans all existing user tasks, habits, projects, ghosts, and meetings in the user's browser.

## 2. Never Wipe or Overwrite Existing User Data
- `getClientDb()` in `src/client/clientStore.ts` and `seedDefaultRoutines()` in `src/server/seedRoutines.ts` must remain **strictly additive and non-destructive**.
- **NEVER** add `DELETE FROM tasks`, `DELETE FROM projects`, `DELETE FROM calendar_events`, or `localStorage.clear()` / `localStorage.removeItem(STORAGE_KEY)` in startup, rollover, or seeding paths.
- **NEVER** create or run destructive cleanup scripts (such as `scripts/clean_gabriel.js`) that delete records for `user_gabriel`.

## 3. Preserve Default User Ownership (`user_gabriel`)
- In `src/client/clientStore.ts`, `/api/v1/auth/default-user` resolves to `gabriel` (`id: 'user_gabriel'`).
- Ensure any tasks, habits, projects, or meetings intended for the default user in `clientStore.ts` use `user_id: 'user_gabriel'` (or match `currentUserId`) so they are not filtered out by `t.user_id === currentUserId`.

## 4. Understand Local SQLite vs. Firebase Hosting Production
- `data/tasks.db` is gitignored and only exists inside the local/ephemeral environment. Writing directly to `data/tasks.db` in an agent VM does **not** affect the live Firebase Hosting site.
- Always run `npm test` and `npm run build` before pushing.
