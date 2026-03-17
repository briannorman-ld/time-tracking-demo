# Feature flags (LaunchDarkly)

The app uses **LaunchDarkly** for two feature flags only.

## Flags used in the app

| Key | Type | Default | Purpose |
|-----|------|--------|---------|
| `show-theme-toggle` | boolean | true | Show/hide the light/dark mode toggle in the sidebar. |
| `show-ld-admin-tools` | boolean | false | Show/hide the LD Admin Tools button and side panel in the header. |

## Where they are read

- **`show-theme-toggle`** — `src/context/ShowThemeToggleContext.tsx` (uses `ldClient.variation()` and subscribes to flag changes).
- **`show-ld-admin-tools`** — `src/App.tsx` (uses `useFlags()` from the LaunchDarkly React SDK).

Create these two flags in your LaunchDarkly project and enable **Client-side** availability so the browser SDK can evaluate them.
