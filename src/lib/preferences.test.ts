import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRoundingPreference,
  setRoundingPreference,
  roundToNearest,
  type RoundingMinutes,
} from '@/lib/preferences'

describe('preferences', () => {
  const storage: Record<string, string> = {}
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        for (const k of Object.keys(storage)) delete storage[k]
      },
      length: 0,
      key: () => null,
    })
  })

  describe('getRoundingPreference', () => {
    it('returns 0 when nothing is set', () => {
      expect(getRoundingPreference()).toBe(0)
    })

    it('returns stored value when valid (0, 5, 10, 15, 30)', () => {
      const cases: RoundingMinutes[] = [0, 5, 10, 15, 30]
      for (const n of cases) {
        setRoundingPreference(n)
        expect(getRoundingPreference()).toBe(n)
      }
    })

    it('returns 0 when stored value is invalid', () => {
      const localStorage = vi.mocked(globalThis.localStorage)
      localStorage.getItem = vi.fn(() => '7')
      expect(getRoundingPreference()).toBe(0)
      localStorage.getItem = vi.fn(() => 'abc')
      expect(getRoundingPreference()).toBe(0)
    })
  })

  describe('setRoundingPreference', () => {
    it('persists value', () => {
      setRoundingPreference(15)
      expect(getRoundingPreference()).toBe(15)
    })
  })

  describe('roundToNearest', () => {
    it('returns minutes unchanged when step is 0', () => {
      expect(roundToNearest(37, 0)).toBe(37)
      expect(roundToNearest(22.5, 0)).toBe(22.5)
    })

    it('rounds to nearest step', () => {
      expect(roundToNearest(32, 5)).toBe(30)
      expect(roundToNearest(33, 5)).toBe(35)
      expect(roundToNearest(37, 10)).toBe(40)
      expect(roundToNearest(52, 15)).toBe(45)
      expect(roundToNearest(58, 15)).toBe(60)
      expect(roundToNearest(50, 30)).toBe(60)
    })
  })
})
