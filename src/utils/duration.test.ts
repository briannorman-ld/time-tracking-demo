import { describe, it, expect } from 'vitest'
import {
  minutesToDecimal,
  decimalToMinutes,
  formatDuration,
} from '@/utils/duration'

describe('duration', () => {
  describe('minutesToDecimal', () => {
    it('converts minutes to decimal hours (Harvest-style)', () => {
      expect(minutesToDecimal(0)).toBe(0)
      expect(minutesToDecimal(60)).toBe(1)
      expect(minutesToDecimal(90)).toBe(1.5)
      expect(minutesToDecimal(30)).toBe(0.5)
      expect(minutesToDecimal(45)).toBe(0.75)
      expect(minutesToDecimal(15)).toBe(0.25)
    })
  })

  describe('decimalToMinutes', () => {
    it('converts decimal hours to minutes', () => {
      expect(decimalToMinutes(0)).toBe(0)
      expect(decimalToMinutes(1)).toBe(60)
      expect(decimalToMinutes(1.5)).toBe(90)
      expect(decimalToMinutes(0.5)).toBe(30)
      expect(decimalToMinutes(0.25)).toBe(15)
    })
  })

  describe('formatDuration', () => {
    it('formats under 60 minutes as "X min"', () => {
      expect(formatDuration(0)).toBe('0 min')
      expect(formatDuration(45)).toBe('45 min')
      expect(formatDuration(59)).toBe('59 min')
    })

    it('formats 60+ minutes as "X hrs" when useHours true', () => {
      expect(formatDuration(60)).toBe('1 hrs')
      expect(formatDuration(90)).toBe('1.5 hrs')
      expect(formatDuration(120)).toBe('2 hrs')
    })

    it('formats as min when useHours false', () => {
      expect(formatDuration(90, false)).toBe('90 min')
    })
  })
})
