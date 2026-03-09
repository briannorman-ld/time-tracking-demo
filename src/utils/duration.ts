/**
 * Decimal hours ↔ minutes (Harvest-style: 1.5 = 1h 30m).
 */
export function minutesToDecimal(minutes: number): number {
  return Math.round(minutes * 100 / 60) / 100
}

export function decimalToMinutes(decimal: number): number {
  return Math.round(decimal * 60)
}

/** Format minutes as "2.5 hrs" or "45 min". */
export function formatDuration(minutes: number, useHours = true): string {
  if (useHours && minutes >= 60) {
    const hrs = minutesToDecimal(minutes)
    return `${hrs} hrs`
  }
  return `${Math.round(minutes)} min`
}
