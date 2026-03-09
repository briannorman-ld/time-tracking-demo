# Feature flagging (exercise)

This folder provides a **stub** flag API for the time-tracker-demo. **No feature-flag provider is installed and no flags are defined.** The app is a demo exercise: add LaunchDarkly (or another provider) on your own.

## Current behavior

- `initFlags()` does nothing except record a stub log (for the Demo Mode SDK tab). Replace with your SDK's client.init().
- `evaluateFlag(flagKey, defaultValue, context?)` returns `defaultValue` only. Replace with your SDK's variation/get method, keeping the same signature so the rest of the app does not need to change.

## Adding LaunchDarkly

1. Install the LaunchDarkly SDK (e.g. `launchdarkly-react-client-sdk`). See `docs/LAUNCHDARKLY.md`.
2. In `initFlags()`, call the SDK's init with your client-side ID and context when available.
3. Replace the `evaluateFlag` implementation to call the SDK's variation method with the same `flagKey` and `defaultValue` contract. Pass `context` when initializing or when calling identify.
4. Create flags in the LaunchDarkly UI for the keys the app uses (e.g. `enableTimer`, `enableReports`, `navLayoutVariant`, `assistantEnabled`) and make them available to client-side SDKs.

No other app code should need to change if you keep the same `evaluateFlag(flagKey, defaultValue, context?)` API.
