# Auth and users

The app uses **passwordless demo auth**: no real passwords or IdP.

## Demo users

Defined in `src/seed/seedUsers.ts`. Examples:

- **Brian** (bnorman) — admin, enterprise, beta tester
- **Alex**, **Priya**, **Marco**, **Jen** — various roles and plan tiers

Switching users updates the session and triggers **`identifyUser(userContext)`** in `src/lib/integration.ts`. That function is a stub; in production you would call your feature-flag or analytics provider’s identify method with the same context.

## User context

`UserContext` (see `src/types/user.ts`) includes:

- userId, username, displayName, email
- traits: appRole, planTier, betaTester, teams, timezone, city

This is what you pass to `identifyUser()` and, in a real setup, to your flag/analytics SDK.

## Session persistence

The current user id is stored in `localStorage` under `time-tracker-demo-session`. On load, the app restores the user and calls `identifyUser` so the Demo Mode Context tab and any future SDKs see the correct user.
