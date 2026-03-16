/**
 * Bridge for sending custom events to LaunchDarkly from non-React code.
 * The app sets the client once (e.g. in a component that has useLDClient); then
 * any module can call trackLaunchDarklyEvent() to send events.
 */

type LDClientLike = { track: (key: string, data?: Record<string, unknown>, metricValue?: number) => void }

let ldClient: LDClientLike | null = null

const LD_EVENT_LOG: LaunchDarklyEventLogEntry[] = []
const LD_EVENT_LOG_MAX = 100

export interface LaunchDarklyEventLogEntry {
  ts: string
  eventKey: string
  data?: Record<string, unknown>
  metricValue?: number
  sent: boolean
}

export function getRecentLaunchDarklyEvents(limit = 50): LaunchDarklyEventLogEntry[] {
  return LD_EVENT_LOG.slice(-limit).reverse()
}

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
  const sent = !!ldClient
  const entry: LaunchDarklyEventLogEntry = {
    ts: new Date().toISOString(),
    eventKey,
    data,
    metricValue,
    sent,
  }
  LD_EVENT_LOG.push(entry)
  if (LD_EVENT_LOG.length > LD_EVENT_LOG_MAX) LD_EVENT_LOG.shift()
  const suffix = sent ? '(sent)' : '(client not set, not sent)'
  console.log('[LaunchDarkly]', eventKey, data ?? {}, metricValue !== undefined ? { metricValue } : {}, suffix)
  if (ldClient) {
    ldClient.track(eventKey, data, metricValue)
  }
}

/** Event keys for time entry creation (for experiments / goals). */
export const LD_EVENT_TTD_TIME_ENTRY_CREATED = 'ttd-time-entry-created'
export const LD_EVENT_TIME_ENTRY_CREATED_TIMER = 'ttd-time-entry-created-timer'
export const LD_EVENT_TIME_ENTRY_CREATED_MANUAL = 'ttd-time-entry-created-manual'

/** Event key sent when the user starts a new timer (no time entry created yet). */
export const LD_EVENT_TIMER_STARTED = 'timer_started'

/** Event key sent when the Reports page is viewed. */
export const LD_EVENT_TTD_REPORTS_PAGE_VIEW = 'ttd-reports-page-view'

/** Event key sent when the Customers page is viewed. */
export const LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW = 'ttd-customers-page-view'

/**
 * Sends the LaunchDarkly event for Reports page view. Call when the Reports page is loaded.
 */
export function trackReportsPageView(): void {
  trackLaunchDarklyEvent(LD_EVENT_TTD_REPORTS_PAGE_VIEW)
}

/**
 * Sends the LaunchDarkly event for Customers page view. Call when the Customers page is loaded.
 */
export function trackCustomersPageView(): void {
  trackLaunchDarklyEvent(LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW)
}

type EntrySource = 'manual' | 'timer' | 'import'

/**
 * Sends the appropriate LaunchDarkly events for a new time entry:
 * - ttd-time-entry-created (any entry)
 * - ttd-time-entry-created-timer (only when source is 'timer')
 * - ttd-time-entry-created-manual (only when source is 'manual' or 'import')
 */
export function trackTimeEntryCreated(
  source: EntrySource,
  data: Record<string, unknown>
): void {
  trackLaunchDarklyEvent(LD_EVENT_TTD_TIME_ENTRY_CREATED, data)
  if (source === 'timer') {
    trackLaunchDarklyEvent(LD_EVENT_TIME_ENTRY_CREATED_TIMER, data)
  } else {
    trackLaunchDarklyEvent(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data)
  }
}
