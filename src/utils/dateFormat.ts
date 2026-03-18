/**
 * Parse YYYY-MM-DD as local date (avoids UTC midnight timezone bugs).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Return YYYY-MM-DD for the given date in local time (use for "today" and storage, not UTC). */
export function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Return an ISO-style timestamp in local time (e.g. "2025-03-18T14:30:00-07:00").
 * Use for createdAt, updatedAt, and any stored timestamp so everything is in the user's local time.
 */
export function toLocalISOTimestamp(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const offsetMin = -d.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const offsetHours = String(Math.floor(absMin / 60)).padStart(2, '0')
  const offsetMins = String(absMin % 60).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}:${s}${sign}${offsetHours}:${offsetMins}`
}

/**
 * Format a YYYY-MM-DD string for display: "Monday, March 9, 2026".
 */
export function formatDisplayDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Short format for entry rows: "Wednesday, 3/18/26". */
export function formatEntryRowDate(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const m = d.getMonth() + 1
  const day = d.getDate()
  const y = String(d.getFullYear()).slice(-2)
  return `${weekday}, ${m}/${day}/${y}`
}

/** Return YYYY-MM-DD of the Monday of the week containing the given date (local). */
export function getWeekStart(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const day = d.getDay() // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const dayNum = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayNum}`
}
