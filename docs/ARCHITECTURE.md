# Architecture

## Tech stack

- **Vite** — build and dev server
- **React 18** — UI (no server components in this MVP)
- **TypeScript** — types throughout
- **Dexie** — IndexedDB wrapper for local-first persistence
- **React Router** — client-side routing

No production feature-flag vendor, AI SDK, or analytics SDK is installed. Integration points are **stubs** with comments and migration notes.

## Data flow

1. **Session** — `SessionContext` holds the current demo user (from `localStorage`). On login or user switch, `identifyUser(userContext)` is called (stub).
2. **Time entries** — Stored in IndexedDB via Dexie, keyed by `userId` and `date`. All CRUD is in `src/lib/entries.ts`.
3. **Flags** — `src/lib/flags/` exposes `evaluateFlag(flagKey, defaultValue, context?)`. Values come from an in-memory mock store; the Demo Mode drawer can change them at runtime.
4. **Events** — `trackEvent(name, payload)` in `src/utils/trackEvent.ts` appends to an in-memory log and persists to IndexedDB so the Demo Mode Events tab can show the last 50 events.

## Where to add real integrations

| Concern | Current location | Migration |
|--------|-------------------|-----------|
| Feature flags | `src/lib/flags/index.ts` | Replace `evaluateFlag` body with your provider’s variation API; init in `initFlags()`. |
| Analytics / identify | `src/lib/integration.ts` → `identifyUser()` | Call your SDK’s identify with `userContext`. |
| Time entry sync | `src/lib/entries.ts` + `src/lib/db.ts` | Add a sync layer that reads/writes your API and uses Dexie as local cache. |
| AI assistant | `src/components/ChatAssistant/RulesEngine.ts` → `parse()` | Replace `parse()` with a call to your AI API and map the response to `ActionProposal`. |

## Project structure (reference)

```
src/
  components/     # UI components (Header, DemoModeDrawer, TimeEntries, ChatAssistant)
  context/        # React context (Session)
  lib/            # DB, entries CRUD, flags, integration stub, preferences
  pages/          # LoginPage
  seed/           # Demo users
  types/          # User, TimeEntry, etc.
  utils/          # trackEvent
  App.tsx, main.tsx
```
