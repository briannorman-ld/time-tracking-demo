# Local setup

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Run the app

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (e.g. `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- No environment variables or API keys are required for the MVP.
- All data is stored locally (IndexedDB + localStorage). Clearing site data will reset entries and session.
- Demo users are hard-coded in `src/seed/seedUsers.ts`; there are no real passwords.
