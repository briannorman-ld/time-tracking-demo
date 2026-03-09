/**
 * Parse YYYY-MM-DD as local date (avoids UTC midnight timezone bugs).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
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
