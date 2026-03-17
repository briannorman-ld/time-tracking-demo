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
  /** True when the event was skipped because a matching event was sent recently (dedupe). */
  deduped?: boolean
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

/** Dedupe window: same event key + payload within this ms is not sent again (avoids React Strict Mode / double-invoke). */
const GLOBAL_DEDUPE_MS = 1500
const lastSentAtByKey: Record<string, number> = {}

function dedupeKey(eventKey: string, data?: Record<string, unknown>, metricValue?: number): string {
  const payload = JSON.stringify({ d: data ?? null, m: metricValue })
  return `${eventKey}\n${payload}`
}

/**
 * Sends a custom event to LaunchDarkly for the current context.
 * No-op if the client has not been set.
 * Duplicate events (same key + payload within 1.5s) are not sent to avoid double-fire from Strict Mode.
 */
export function trackLaunchDarklyEvent(
  eventKey: string,
  data?: Record<string, unknown>,
  metricValue?: number
): void {
  const now = Date.now()
  const key = dedupeKey(eventKey, data, metricValue)
  const lastSent = lastSentAtByKey[key]
  const isDuplicate = lastSent != null && now - lastSent < GLOBAL_DEDUPE_MS

  const entry: LaunchDarklyEventLogEntry = {
    ts: new Date().toISOString(),
    eventKey,
    data,
    metricValue,
    sent: !isDuplicate && !!ldClient,
    deduped: isDuplicate,
  }
  LD_EVENT_LOG.push(entry)
  if (LD_EVENT_LOG.length > LD_EVENT_LOG_MAX) LD_EVENT_LOG.shift()

  if (isDuplicate) {
    console.log('[LaunchDarkly]', eventKey, '(deduped, not sent)')
    return
  }
  if (ldClient) {
    lastSentAtByKey[key] = now
    ldClient.track(eventKey, data, metricValue)
    console.log('[LaunchDarkly]', eventKey, data ?? {}, metricValue !== undefined ? { metricValue } : {}, '(sent)')
  } else {
    console.log('[LaunchDarkly]', eventKey, '(client not set, not sent)')
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

/** Dedupe window (ms) so page-view events don't fire twice under React Strict Mode. */
const PAGE_VIEW_DEDUPE_MS = 2000
const lastPageViewSentAt: Record<string, number> = {}

function trackPageViewOnce(eventKey: string): void {
  const now = Date.now()
  if (lastPageViewSentAt[eventKey] != null && now - lastPageViewSentAt[eventKey] < PAGE_VIEW_DEDUPE_MS) {
    return
  }
  lastPageViewSentAt[eventKey] = now
  trackLaunchDarklyEvent(eventKey)
}

/**
 * Sends the LaunchDarkly event for Reports page view. Call when the Reports page is loaded.
 * Deduped so it fires at most once per 2s (avoids double fire under React Strict Mode).
 */
export function trackReportsPageView(): void {
  trackPageViewOnce(LD_EVENT_TTD_REPORTS_PAGE_VIEW)
}

/**
 * Sends the LaunchDarkly event for Customers page view. Call when the Customers page is loaded.
 * Deduped so it fires at most once per 2s (avoids double fire under React Strict Mode).
 */
export function trackCustomersPageView(): void {
  trackPageViewOnce(LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW)
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
