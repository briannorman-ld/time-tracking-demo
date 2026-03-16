/**
 * Bridge for sending custom events to LaunchDarkly from non-React code.
 * The app sets the client once (e.g. in a component that has useLDClient); then
 * any module can call trackLaunchDarklyEvent() to send events.
 */

type LDClientLike = { track: (key: string, data?: Record<string, unknown>, metricValue?: number) => void }

let ldClient: LDClientLike | null = null

export function setLaunchDarklyClient(client: LDClientLike | null): void {
  ldClient = client
  console.log('[LaunchDarkly] client', client ? 'set' : 'cleared')
}

export function getLaunchDarklyClient(): LDClientLike | null {
  return ldClient
}

/**
 * Sends a custom event to LaunchDarkly for the current context.
 * No-op if the client has not been set.
 */
export function trackLaunchDarklyEvent(
  eventKey: string,
  data?: Record<string, unknown>,
  metricValue?: number
): void {
  const suffix = ldClient ? '(sent)' : '(client not set, not sent)'
  console.log('[LaunchDarkly]', eventKey, data ?? {}, metricValue !== undefined ? { metricValue } : {}, suffix)
  if (ldClient) {
    ldClient.track(eventKey, data, metricValue)
  }
}

/** Event keys for time entry creation (for experiments / goals). */
export const LD_EVENT_TIME_ENTRY_CREATED = 'time_entry_created'
export const LD_EVENT_TIME_ENTRY_CREATED_TIMER = 'time_entry_created_timer'
export const LD_EVENT_TIME_ENTRY_CREATED_MANUAL = 'time_entry_created_manual'

/** Event key sent when the user starts a new timer (no time entry created yet). */
export const LD_EVENT_TIMER_STARTED = 'timer_started'

type EntrySource = 'manual' | 'timer' | 'import'

/**
 * Sends the appropriate LaunchDarkly events for a new time entry:
 * - time_entry_created (any entry)
 * - time_entry_created_timer (only when source is 'timer')
 * - time_entry_created_manual (only when source is 'manual' or 'import')
 */
export function trackTimeEntryCreated(
  source: EntrySource,
  data: Record<string, unknown>
): void {
  trackLaunchDarklyEvent(LD_EVENT_TIME_ENTRY_CREATED, data)
  if (source === 'timer') {
    trackLaunchDarklyEvent(LD_EVENT_TIME_ENTRY_CREATED_TIMER, data)
  } else {
    trackLaunchDarklyEvent(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data)
  }
}
