# LaunchDarkly with this repo

This guide teaches you how to use **LaunchDarkly** with the time-tracking-demo app: install the SDK, set context, create flags, run experiments, use guarded releases, and work with AI Configs. It's written for someone who has just pulled the repo and wants to plug in LaunchDarkly.

---

## How this repo uses flags today

The app uses a **mock** flag system so it runs without any external service:

- **`src/lib/flags/index.ts`** — `evaluateFlag(flagKey, defaultValue, context?)` reads from an in-memory store and returns the value or `defaultValue`. Evaluations are logged for the Demo Mode Events tab.
- **`src/lib/flags/README.md`** — Describes replacing the mock with a real provider.

Flags currently used in the app include:

- `navLayoutVariant` — `'tabs'` or `'sidebar'`
- `enableTimer`, `enableReports`, `assistantEnabled` — booleans
- `showThemeToggle` — boolean; show/hide the light/dark mode button in the sidebar (LD “Show” flag: **Show: theme toggle**).
- (Previously `entryCreateUx` — form vs quick-add.)

To use LaunchDarkly, you will:

1. Install the LaunchDarkly React/JS SDK.
2. Initialize the client with your **client-side ID** and **context**.
3. Replace the `evaluateFlag` implementation with SDK variation calls.
4. Optionally use experiments, guarded rollouts, or AI Configs.

---

## 1. Install the SDK

Use the **React Web SDK** so flags are available via React context and hooks.

### React app (recommended)

```bash
npm install launchdarkly-react-client-sdk
# or
yarn add launchdarkly-react-client-sdk
```

Optional (observability and session replay; require React Web SDK 3.7+):

```bash
npm install @launchdarkly/observability @launchdarkly/session-replay
```

- **React Web SDK** — [npm](https://www.npmjs.com/package/launchdarkly-react-client-sdk), [docs](https://docs.launchdarkly.com/sdk/client-side/react/react-web/).
- **JavaScript SDK (non-React)** — `@launchdarkly/js-client-sdk` (v4) or `launchdarkly-js-client-sdk` (v3). The React SDK is built on the JS SDK.

**Important:** Use your **client-side ID**, not the server-side SDK key. Client-side IDs are per project and environment, are not secret, and can live in client code. Find them under **Project settings → Environments**. Do not embed a server-side SDK key in the browser.

---

## 2. Set a context

LaunchDarkly evaluates flags for a **context**: the entity (user, device, organization, etc.) that is seeing the app. Targeting and rollouts are based on this context.

### Context shape

A context has:

- **`kind`** — e.g. `"user"`, `"organization"`, `"device"`. Omit `kind` and LaunchDarkly treats it as a **user** (legacy behavior).
- **`key`** — Unique, stable id for that context (e.g. user id). **Required.**
- **Attributes** — Optional: `name`, `email`, custom attributes for targeting.

Example:

```json
{
  "kind": "user",
  "key": "user-123",
  "name": "Sandy Smith",
  "email": "sandy@example.com"
}
```

[Contexts](https://docs.launchdarkly.com/home/flags/contexts) · [Context kinds](https://docs.launchdarkly.com/home/flags/context-kinds) · [Context attributes](https://docs.launchdarkly.com/home/flags/context-attributes)

### Passing context when initializing (React)

With **asyncWithLDProvider** (recommended — wait for init before first paint):

```js
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';

const LDProvider = await asyncWithLDProvider({
  clientSideID: 'your-client-side-id',
  context: {
    kind: 'user',
    key: currentUser.id,
    name: currentUser.displayName,
    email: currentUser.email,
  },
});

// Then render:
// <LDProvider><App /></LDProvider>
```

With **withLDProvider** you can pass `context` in the config or use **deferInitialization** and call **identify** later when the user is known.

### Identifying / changing context after init

If you don't have the user at startup, omit `context` (SDK uses an anonymous context), then when the user logs in:

```js
import { useLDClient } from 'launchdarkly-react-client-sdk';

function App() {
  const ldClient = useLDClient();

  useEffect(() => {
    if (currentUser) {
      ldClient.identify({
        kind: 'user',
        key: currentUser.id,
        name: currentUser.displayName,
      });
    }
  }, [currentUser]);

  return // ...
}
```

[Identifying and changing contexts](https://docs.launchdarkly.com/sdk/features/identify#react)

### Multi-contexts

You can evaluate flags for more than one context at once (e.g. user + organization). See [Multi-contexts](https://docs.launchdarkly.com/home/flags/multi-contexts). The React SDK supports passing a multi-context in the same way you pass a single context.

---

## 3. Create a flag

Flags live in the LaunchDarkly project and define **variations** (e.g. on/off, or several string/number/JSON values). You create and edit them in the UI (or via API).

### In the UI

1. Go to **Flags** in the left nav.
2. **Create flag** → enter **Name** (and optionally **Key**; key is what you use in code).
3. Choose **Variations**: boolean, string, number, or JSON.
4. Set **Default on** / **Default off** (and add more variations for non-boolean).
5. **Create flag**.

[Creating new flags](https://docs.launchdarkly.com/home/flags/new/)

### Flag key

- Use the **flag key** in your code (e.g. `evaluateFlag('enableTimer', true)` → flag key `enableTimer`).
- Keys can contain letters, numbers, `.`, `_`, `-`. After save, the key cannot be changed.
- React Web SDK **camelCases** flag keys by default (e.g. `enable-timer` → `flags.enableTimer`). You can turn this off with `reactOptions: { useCamelCaseFlagKeys: false }` and use bracket notation.

### Client-side and mobile availability

By default, flags are **server-side only**. For browser/mobile SDKs you must **make the flag available to client-side SDKs**:

- When creating the flag: check **SDKs using Client-side ID** (and/or Mobile key if needed).
- For existing flags: in the flag's right sidebar, turn on **Client-side** (and/or Mobile) availability.

If a client-side SDK evaluates a flag that isn't marked client-side available, it gets the **fallback** (default) value.

[Make flags available to client-side and mobile SDKs](https://docs.launchdarkly.com/home/flags/new/#make-flags-available-to-client-side-and-mobile-sdks)

### Evaluating in code (after SDK is in place)

Once the React app is wrapped in the LaunchDarkly provider and context is set:

```js
import { useFlags } from 'launchdarkly-react-client-sdk';

function MyComponent() {
  const flags = useFlags();
  const enableTimer = flags.enableTimer ?? true;  // fallback if not yet loaded
  return enableTimer ? <Timer /> : null;
}
```

Or with the underlying client (e.g. for non-React code or when you need the exact key):

```js
const value = ldClient.variation('enableTimer', true);
```

To align with this repo's API, implement `evaluateFlag(flagKey, defaultValue, context?)` by calling the SDK's variation method with `flagKey` and `defaultValue`; pass `context` when initializing or when calling `identify`.

---

## 4. Build an experiment

Experiments let you run A/B (or A/A) tests on a flag and measure impact with **metrics**.

### Prerequisites

- A **flag** (or AI Config) with **variations** you want to test.
- **Metrics** to measure (e.g. click, conversion, revenue). You can use LaunchDarkly-hosted metrics or warehouse-native metrics.
- SDK must be sending **events** (default for client-side SDKs).

[Experimentation overview](https://docs.launchdarkly.com/home/experimentation/) · [Creating experiments](https://docs.launchdarkly.com/home/experimentation/create)

### Steps (high level)

1. **Create a metric** (or use an existing one): **Metrics** → Create. Define what you're measuring (e.g. custom event, page view, numeric value).
2. **Create the experiment**: **Experimentation** → Create experiment.
   - Choose **Metric source** (LaunchDarkly or warehouse).
   - Choose **Context kind** to randomize by (e.g. user).
   - Select the **flag** (or AI Config) and the **targeting rule** (e.g. default rule).
   - Attach **metrics**, set **sample size**, **control** variation, and **statistical approach** (Bayesian or frequentist).
3. **Turn the flag on** (if it isn't already). AI Configs are on by default.
4. **Start an iteration** for the environment(s) you want. Data is collected per iteration.

[Starting and stopping experiment iterations](https://docs.launchdarkly.com/home/experimentation/start-stop-exp)

### Sending events for experiments

The client-side SDK sends analytics events when you evaluate flags (and can send custom events). For experiments you typically:

- Rely on **flag evaluation** events (ensure flags used in the experiment are evaluated with the right context).
- Optionally send **custom events** (e.g. `ldClient.track('Signed up', { plan: 'pro' })`) and attach them to metrics.

[Custom events (JavaScript)](https://docs.launchdarkly.com/sdk/features/events#javascript)

---

## 5. Use a guarded release

**Guarded rollouts** gradually increase traffic to a new flag (or AI Config) variation while watching **metrics** for regressions. If a regression is detected, LaunchDarkly can notify you and optionally **automatically roll back**.

- Available on **Guardian** plan (with a limited trial for all accounts).
- You attach one or more **metrics** and set **regression thresholds**. LaunchDarkly ramps traffic over a **rollout duration** and can roll back if the new variation performs worse than allowed.

[Guarded rollouts](https://docs.launchdarkly.com/home/releases/guarded-rollouts/) · [Creating guarded rollouts](https://docs.launchdarkly.com/home/releases/creating-guarded-rollouts)

### Prerequisites

- **Metrics** already created (same as for experiments).
- **Context kind** to use as the randomization unit (e.g. user). For custom context kinds, "Available for experiments and guarded rollouts" must be enabled.
- No other **guarded rollout**, **progressive rollout**, or **experiment** on the same flag/rule; flag must not be a migration flag.

### Steps (high level)

1. Open the **flag** (or AI Config) → **Targeting** tab.
2. Edit the rule that will serve the new variation → under **Serve**, choose **Guarded rollout**.
3. **Regression detection and behavior**: set how much worse the new variation can perform before it's considered a regression; optionally enable **Automatic rollback**.
4. Select **metrics** to monitor.
5. Choose **context kind** (randomization unit) and **target variation**.
6. Set **rollout duration** (or use default). LaunchDarkly increases the percentage of contexts that get the new variation over that period.
7. **Review and save**. Optionally add reviewers and request approval.

If the minimum number of contexts isn't reached in a step, LaunchDarkly can extend the step or roll back. [Managing guarded rollouts](https://docs.launchdarkly.com/home/releases/managing-guarded-rollouts) · [Regression thresholds](https://docs.launchdarkly.com/home/releases/regression-thresholds)

---

## 6. Use AI Configs

**AI Configs** manage how your app uses **LLMs** (prompts, models, instructions) without redeploying. You can target different configs by context, run experiments, and use guarded rollouts.

- **Completion mode** — Single-step prompts (messages + roles). You can attach **judges** to variations in the UI.
- **Agent mode** — Multi-step workflows (instructions). You invoke judges via the **AI SDK** in code.

[AI Configs overview](https://docs.launchdarkly.com/home/ai-configs/) · [Quickstart for AI Configs](https://docs.launchdarkly.com/home/ai-configs/quickstart)

### Capabilities

- Run **experiments** on AI Config variations (e.g. satisfaction, cost, latency).
- **Target** by user type, geography, or other context.
- **Gradually roll out** new models or prompts (including guarded rollouts).
- **Evaluate** outputs with judges (in UI for completion mode, or programmatically with the AI SDK).

AI Configs are an **add-on**; if you don't see them, your plan may not include them. [Pricing](https://launchdarkly.com/pricing/).

### In your app

Use one of the **AI SDKs** (e.g. [Node](https://docs.launchdarkly.com/sdk/ai/node-js), [Python](https://docs.launchdarkly.com/sdk/ai/python)). The SDK evaluates the AI Config for the current context and returns the variation (model, messages/instructions). You then call your LLM with that config and can record metrics (tokens, satisfaction, etc.) back to LaunchDarkly.

[Customizing AI Configs (SDK)](https://docs.launchdarkly.com/sdk/features/ai-config) · [Run experiments with AI Configs](https://docs.launchdarkly.com/home/ai-configs/experimentation)

---

## 7. Other useful topics

- **Targeting rules** — Serve different variations to different contexts (e.g. by attribute, segment, or percentage). [Targeting](https://docs.launchdarkly.com/home/flags/target)
- **Percentage rollouts** — Manually set the share of contexts that get each variation (e.g. 10% new, 90% control). [Percentage rollouts](https://docs.launchdarkly.com/home/releases/percentage-rollouts)
- **Bootstrapping** — Provide initial flag values at init so the app can render before the first network response. [Bootstrapping](https://docs.launchdarkly.com/sdk/features/bootstrapping#javascript)
- **Keys** — Client-side ID (browser/mobile) vs SDK key (server). Never put the SDK key in client code. [Keys](https://docs.launchdarkly.com/sdk/concepts/client-side-server-side#keys)
- **Local development** — For `ldcli` dev-server, use the **project key** and set service endpoints to `http://localhost:8765` to avoid CORS and use local flag state.
- **Shut down** — Call the client's close/shutdown when the app unloads. [Shutting down](https://docs.launchdarkly.com/sdk/features/shutdown#javascript)

---

## Quick reference: wiring this repo to LaunchDarkly

1. **Install:** `npm install launchdarkly-react-client-sdk`
2. **Get client-side ID** from Project settings → Environments (e.g. Production, Test).
3. **Wrap app** with `asyncWithLDProvider({ clientSideID, context })` (or `withLDProvider`), and call `identify()` when the user logs in if you defer context.
4. **Replace `evaluateFlag`** in `src/lib/flags/index.ts` so it calls the LaunchDarkly client's `variation(flagKey, defaultValue)` (and pass the same `context` via init/identify).
5. **Create flags** in the UI for `enableTimer`, `enableReports`, `navLayoutVariant`, `assistantEnabled`, etc., and enable **Client-side** availability.
6. **Optional:** Add experiments, guarded rollouts, or AI Configs as above.

Keeping the existing `evaluateFlag(flagKey, defaultValue, context?)` signature means the rest of the app (TimeEntries, App, etc.) can stay unchanged.
