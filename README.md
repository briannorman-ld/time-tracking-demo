# Time Tracker Demo

A minimal **Vite + React + TypeScript** time-tracking web app. All data is stored locally (IndexedDB + localStorage). No production feature-flag, AI, or analytics SDKs — only stubs and clear comments for future integrations.

## Get started

**Prerequisites:** Node.js 18+ and npm (or pnpm/yarn).

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. **http://localhost:5173**). No environment variables or API keys are required.

- **Log in** — Pick a demo user from the header (Brian, Alex, Priya, Marco, Jen). No passwords.
- **Time entries** — Add time manually (“Add time”) or start a timer; entries appear in the list. Pause a timer to save that segment as an entry; resume anytime.
- **Customers** — Use the customer dropdown to pick an existing customer or “+ Create new customer”. Search filters the list.
- **Demo Mode** — Open from the header to inspect context, flags, events, and SDK status.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint               |

## Features

- **Demo auth** — Passwordless login; switch users via header.
- **Time entries** — CRUD with Day/Week views; manual form and timer; rounding preference (0/5/10/15/30 min).
- **Multiple timers** — Start a timer (it appears in the entries list); pause to save a segment, resume later. Create new customers from the dropdown with search.
- **Mock feature flags** — Centralized `evaluateFlag()`; Demo Mode drawer to flip flags at runtime.
- **Demo Mode** — Context, Flags, Events, SDK tabs (controlled by `demoModeEnabled` flag).
- **Chat Assistant** — Rules-based intent parsing (no AI); enable via `assistantEnabled` flag in Demo Mode.
- **Instrumentation** — `trackEvent()` for key actions; events visible in Demo Mode → Events.

## Docs

See **[docs/README.md](./docs/README.md)** for architecture, local setup, feature flags, instrumentation, and auth.

## License

See [LICENSE](./LICENSE).
