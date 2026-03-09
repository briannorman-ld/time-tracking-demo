import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initFlags, evaluateFlag, getInitLogs, isInitDone } from '@/lib/flags'

describe('flags', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('initFlags', () => {
    it('returns initialized true and logs', () => {
      const result = initFlags()
      expect(result.initialized).toBe(true)
      expect(Array.isArray(result.logs)).toBe(true)
      expect(result.logs.length).toBeGreaterThan(0)
    })

    it('is idempotent on second call', () => {
      const first = initFlags()
      const second = initFlags()
      expect(second.initialized).toBe(true)
      expect(second.logs).toEqual(first.logs)
    })
  })

  describe('evaluateFlag', () => {
    it('returns default value for any key', () => {
      expect(evaluateFlag('someFlag', true)).toBe(true)
      expect(evaluateFlag('someFlag', false)).toBe(false)
      expect(evaluateFlag('another', 'value')).toBe('value')
      expect(evaluateFlag('num', 42)).toBe(42)
    })

    it('accepts optional context', () => {
      expect(evaluateFlag('flag', 'default', { userId: 'u1' })).toBe('default')
    })
  })

  describe('getInitLogs', () => {
    it('returns copy of init logs', () => {
      initFlags()
      const logs = getInitLogs()
      expect(Array.isArray(logs)).toBe(true)
      const again = getInitLogs()
      expect(again).not.toBe(logs)
      expect(again).toEqual(logs)
    })
  })

  describe('isInitDone', () => {
    it('returns true after initFlags', () => {
      initFlags()
      expect(isInitDone()).toBe(true)
    })
  })
})
