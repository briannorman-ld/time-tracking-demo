# Instrumentation and events

The app tracks a small set of events for the **Demo Mode → Events** tab. No external analytics SDK is used.

## API

- **`trackEvent(name: string, payload?: object)`** — Appends an event to an in-memory log and persists it to IndexedDB (debounced). Events are capped at 50 in memory.

- **`getRecentEvents(limit?)`** — Returns the last 50 events (in-memory + DB), used by the Demo Mode Events tab.

## Events emitted by the app

| Event name | Payload |
|------------|---------|
| `entry_created` | entryId, userId, customer, durationMinutes |
| `entry_updated` | entryId, fieldsChanged |
| `entry_deleted` | entryId |
| `view_changed` | view: "day" \| "week" |
| `user_switched` | userId |
| `flag_evaluated` | flagKey, value, userKey, fromMock |
| `identify_called` | userKey |
| `assistant_action_confirmed` | intent, … (when user confirms a Chat Assistant action) |

## Replacing with a real analytics provider

Point `trackEvent` at your provider’s track API (e.g. Segment, Mixpanel). You can keep the same event names and payload shapes, or map them in `trackEvent` to your provider’s schema.
