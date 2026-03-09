import { describe, it, expect } from 'vitest'
import { formatDisplayDate, getWeekStart } from './dateFormat'

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
