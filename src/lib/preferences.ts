/**
 * Rounding preference (minutes). Used when creating/editing entries from timer or manual input.
 */
export type RoundingMinutes = 0 | 5 | 10 | 15 | 30

const PREF_KEY = 'time-tracker-demo-rounding'

export function getRoundingPreference(): RoundingMinutes {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === null) return 0
    const n = parseInt(v, 10)
    if ([0, 5, 10, 15, 30].includes(n)) return n as RoundingMinutes
  } catch {}
  return 0
}

export function setRoundingPreference(value: RoundingMinutes): void {
  localStorage.setItem(PREF_KEY, String(value))
}

export function roundToNearest(minutes: number, step: RoundingMinutes): number {
  if (step === 0) return minutes
  return Math.round(minutes / step) * step
}
