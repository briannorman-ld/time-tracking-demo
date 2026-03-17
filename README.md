# Time Tracker Demo

A **Vite + React + TypeScript** time-tracking web app. Data is stored locally (IndexedDB + localStorage). Feature flags and event instrumentation use **LaunchDarkly**.

## Get started

**Prerequisites:** Node.js 18+ and npm (or pnpm/yarn).

```bash
npm install
cp .env.example .env   # optional: add VITE_LAUNCHDARKLY_CLIENT_ID for LaunchDarkly
npm run dev
```

Open the URL shown in the terminal (e.g. **http://localhost:5173**).

- **Log in** — Pick a demo user from the header (Brian, Alex, Priya, Marco, Jen). No passwords.
- **Time entries** — Add time manually (“Add time”) or start a timer; entries appear in the list. Pause a timer to save that segment; resume from the play button on an entry when a paused timer matches. Day/Week views; optional rounding (0/5/10/15/30 min).
- **Customers** — Use the customer dropdown to pick or “+ Create new customer”. Search filters the list.
- **Theme** — Light/dark toggle in the sidebar (when the `show-theme-toggle` flag is on).
- **LD Admin Tools** — When the `show-ld-admin-tools` flag is on, a header button opens a panel to inspect context, flags, events, and SDK status.

## Scripts

| Command           | Description                |
|-------------------|----------------------------|
| `npm run dev`     | Start dev server           |
| `npm run build`   | Production build           |
| `npm run preview` | Preview production build   |
| `npm run lint`    | Run ESLint                 |
| `npm run test`    | Run tests (watch)          |
| `npm run test:run`| Run tests once             |

## Features

- **Demo auth** — Passwordless login; switch users via header.
- **Time entries** — CRUD with Day/Week views; manual form and timer; pause/resume; rounding preference. Optional **tile layout** when the `tile-layout` flag is on (3/2/1 columns by width).
- **LaunchDarkly** — Feature flags (`show-theme-toggle`, `show-ld-admin-tools`, `tile-layout`) and event tracking. Set `VITE_LAUNCHDARKLY_CLIENT_ID` in `.env` and create the flags in your LaunchDarkly project (client-side).
- **LD Admin Tools panel** — Context, event log, and SDK info (when enabled by flag).
- **Chat Assistant** — Rules-based intent parsing (no AI).
- **GitHub Pages** — Workflow to build and deploy; see [docs/GITHUB_PAGES.md](./docs/GITHUB_PAGES.md).

## Docs

- **[docs/README.md](./docs/README.md)** — Doc index and architecture.
- **[docs/FEATURE_FLAGS.md](./docs/FEATURE_FLAGS.md)** — LaunchDarkly flags used in the app.
- **[docs/LAUNCHDARKLY.md](./docs/LAUNCHDARKLY.md)** — LaunchDarkly setup and usage.
- **[docs/GITHUB_PAGES.md](./docs/GITHUB_PAGES.md)** — Publishing to GitHub Pages.

## License

See [LICENSE](./LICENSE).
