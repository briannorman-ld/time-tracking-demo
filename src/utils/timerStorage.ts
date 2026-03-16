/**
 * Persisted active timers (multiple allowed; only one running at a time).
 */
const TIMER_STORAGE_KEY = 'time-tracker-demo-timers'

export interface PersistedActiveTimer {
  id: string
  userId: string
  customer: string
  project?: string
  notes: string
  startTime: number // epoch ms (when last started / when created)
  elapsedSec: number
  running: boolean
  /** ID of the time entry created when this timer was started (for updating on pause). */
  entryId?: string
}

export function loadActiveTimers(userId: string): PersistedActiveTimer[] {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as PersistedActiveTimer[]
    return data.filter((t) => t.userId === userId)
  } catch {
    return []
  }
}

export function saveActiveTimers(timers: PersistedActiveTimer[]): void {
  if (!timers.length) {
    localStorage.removeItem(TIMER_STORAGE_KEY)
    return
  }
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers))
}

export function clearTimerState(): void {
  localStorage.removeItem(TIMER_STORAGE_KEY)
}

const LEGACY_TIMER_KEY = 'time-tracker-demo-timer'

/** Load legacy single-timer state for migration. */
export function loadLegacyTimerState(userId: string): PersistedActiveTimer | null {
  try {
    const raw = localStorage.getItem(LEGACY_TIMER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { userId: string; customer: string; project?: string; notes: string; startTime: number; elapsedSec: number; running: boolean }
    if (data.userId !== userId) return null
    return {
      id: `legacy-${Date.now()}`,
      userId: data.userId,
      customer: data.customer,
      project: data.project,
      notes: data.notes,
      startTime: data.startTime,
      elapsedSec: data.elapsedSec,
      running: data.running,
    }
  } catch {
    return null
  }
}

export function clearLegacyTimerState(): void {
  localStorage.removeItem(LEGACY_TIMER_KEY)
}
