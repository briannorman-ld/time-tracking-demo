# Feature flags (LaunchDarkly)

The app uses **LaunchDarkly** for feature flags.

## Flags used in the app

| Key | Type | Default | Purpose |
|-----|------|--------|---------|
| `show-theme-toggle` | boolean | true | Show/hide the light/dark mode toggle in the sidebar. |
| `show-ld-admin-tools` | boolean | false | Show/hide the LD Admin Tools button and side panel in the header. |
| `tile-layout` | boolean | false | Show time entries as tiles (3 per row at full width, 2 then 1 as screen shrinks) instead of one entry per row. |

## Where they are read

- **`show-theme-toggle`** — `src/context/ShowThemeToggleContext.tsx` (uses `ldClient.variation()` and subscribes to flag changes).
- **`show-ld-admin-tools`** — `src/App.tsx` (uses `useFlags()` from the LaunchDarkly React SDK).
- **`tile-layout`** — `src/components/TimeEntries/TimeEntries.tsx` (uses `useFlags()` from the LaunchDarkly React SDK).

Create these flags in your LaunchDarkly project and enable **Client-side** availability so the browser SDK can evaluate them.
