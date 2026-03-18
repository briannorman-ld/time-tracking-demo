import { describe, it, expect } from 'vitest'
import { formatDateLocal, formatDisplayDate, formatEntryRowDate, getWeekStart, toLocalISOTimestamp } from './dateFormat'

describe('formatDateLocal', () => {
  it('returns YYYY-MM-DD for a Date in local time', () => {
    // Use a date that would differ in UTC (e.g. late evening local)
    const d = new Date(2025, 2, 18) // March 18, 2025 local
    expect(formatDateLocal(d)).toBe('2025-03-18')
  })

  it('pads month and day with zero', () => {
    const d = new Date(2025, 0, 5) // Jan 5
    expect(formatDateLocal(d)).toBe('2025-01-05')
  })
})

describe('toLocalISOTimestamp', () => {
  it('returns ISO-style string with local date/time and offset', () => {
    const d = new Date(2025, 2, 18, 14, 30, 0) // March 18, 2025 14:30:00 local
    const ts = toLocalISOTimestamp(d)
    expect(ts).toMatch(/^2025-03-18T14:30:00[+-]\d{2}:\d{2}$/)
  })

  it('uses current time when no argument', () => {
    const ts = toLocalISOTimestamp()
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })
})

describe('formatDisplayDate', () => {
  it('formats YYYY-MM-DD as "Weekday, Month Day, Year"', () => {
    expect(formatDisplayDate('2026-03-09')).toBe('Monday, March 9, 2026')
  })

  it('formats another date correctly', () => {
    expect(formatDisplayDate('2025-12-25')).toBe('Thursday, December 25, 2025')
  })

  it('uses local date (no UTC shift)', () => {
    // Jan 1 in local time should be Wednesday
    expect(formatDisplayDate('2025-01-01')).toBe('Wednesday, January 1, 2025')
  })
})

describe('formatEntryRowDate', () => {
  it('formats as "Weekday, M/D/YY"', () => {
    expect(formatEntryRowDate('2026-03-18')).toBe('Wednesday, 3/18/26')
  })

  it('pads single-digit month and day when needed for display', () => {
    // March 9 = 3/9/26 (no leading zero in output)
    expect(formatEntryRowDate('2026-03-09')).toBe('Monday, 3/9/26')
  })
})

describe('getWeekStart', () => {
  it('returns same date for a Monday', () => {
    expect(getWeekStart('2026-03-09')).toBe('2026-03-09')
  })

  it('returns Monday of the week for a Sunday', () => {
    expect(getWeekStart('2026-03-08')).toBe('2026-03-02')
  })

  it('returns Monday for a mid-week day', () => {
    expect(getWeekStart('2026-03-12')).toBe('2026-03-09') // Thursday -> Monday
  })
})
