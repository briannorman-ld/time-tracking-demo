# Feature flags (mock)

The app uses a **mock** feature-flag system in `src/lib/flags/`. No external vendor is installed.

## API

- **`initFlags()`** — Stub initializer; returns `{ initialized, logs }`. Call once at app load.
- **`evaluateFlag(flagKey, defaultValue, context?)`** — Returns the value for `flagKey` from the in-memory store, or `defaultValue`. Logs each evaluation for the Demo Mode Events tab.
- **`setMockFlag(flagKey, value)`** — Sets a flag at runtime (used by the Demo Mode Flags tab).

## Flags used in the app

| Key | Type | Default | Purpose |
|-----|------|--------|---------|
| `demoModeEnabled` | boolean | true | Show/hide the Demo Mode drawer control. |
| `entryCreateUx` | "form" \| "quickAdd" | "form" | Full form vs quick-add for new entries. |
| `navLayoutVariant` | "tabs" \| "sidebar" | "tabs" | Day/Week layout style. |
| `enableTimer` | boolean | true | Show/hide the timer UI. |
| `enableReports` | boolean | true | Show/hide the minimal reports card. |
| `assistantEnabled` | boolean | false | Show/hide the Chat Assistant. |

## Replacing with a real provider

See `src/lib/flags/README.md` for step-by-step migration notes. Keep the same `evaluateFlag(flagKey, defaultValue, context?)` contract so the rest of the app does not need to change.
