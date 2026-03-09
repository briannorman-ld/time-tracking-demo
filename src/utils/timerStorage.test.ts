import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadActiveTimers,
  saveActiveTimers,
  clearTimerState,
  loadLegacyTimerState,
  clearLegacyTimerState,
  type PersistedActiveTimer,
} from '@/utils/timerStorage'

describe('timerStorage', () => {
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

  const userId = 'user-1'

  describe('loadActiveTimers', () => {
    it('returns empty array when nothing stored', () => {
      expect(loadActiveTimers(userId)).toEqual([])
    })

    it('returns only timers for the given userId', () => {
      const timers: PersistedActiveTimer[] = [
        { id: 'a', userId, customer: 'Acme', notes: '', startTime: 0, elapsedSec: 0, running: true },
        { id: 'b', userId: 'user-2', customer: 'Other', notes: '', startTime: 0, elapsedSec: 0, running: false },
      ]
      saveActiveTimers(timers)
      expect(loadActiveTimers(userId)).toHaveLength(1)
      expect(loadActiveTimers(userId)[0].customer).toBe('Acme')
    })

    it('returns [] when stored data is invalid JSON', () => {
      storage['time-tracker-demo-timers'] = 'not json'
      expect(loadActiveTimers(userId)).toEqual([])
    })
  })

  describe('saveActiveTimers', () => {
    it('stores timers and removes key when empty', () => {
      const timers: PersistedActiveTimer[] = [
        { id: 'a', userId, customer: 'Acme', notes: '', startTime: 1000, elapsedSec: 60, running: true },
      ]
      saveActiveTimers(timers)
      expect(loadActiveTimers(userId)).toHaveLength(1)
      expect(loadActiveTimers(userId)[0].customer).toBe('Acme')
      saveActiveTimers([])
      expect(loadActiveTimers(userId)).toEqual([])
      expect(storage['time-tracker-demo-timers']).toBeUndefined()
    })
  })

  describe('clearTimerState', () => {
    it('removes timers key', () => {
      saveActiveTimers([{ id: 'a', userId, customer: 'A', notes: '', startTime: 0, elapsedSec: 0, running: false }])
      clearTimerState()
      expect(loadActiveTimers(userId)).toEqual([])
    })
  })

  describe('loadLegacyTimerState', () => {
    it('returns null when no legacy key', () => {
      expect(loadLegacyTimerState(userId)).toBeNull()
    })

    it('returns migrated timer when legacy key exists for user', () => {
      const legacy = {
        userId,
        customer: 'Legacy Co',
        notes: 'notes',
        startTime: 1000,
        elapsedSec: 120,
        running: true,
      }
      storage['time-tracker-demo-timer'] = JSON.stringify(legacy)
      const result = loadLegacyTimerState(userId)
      expect(result).not.toBeNull()
      expect(result!.customer).toBe('Legacy Co')
      expect(result!.userId).toBe(userId)
      expect(result!.id).toMatch(/^legacy-/)
    })

    it('returns null when legacy key is for different user', () => {
      storage['time-tracker-demo-timer'] = JSON.stringify({ userId: 'other', customer: 'A', notes: '', startTime: 0, elapsedSec: 0, running: false })
      expect(loadLegacyTimerState(userId)).toBeNull()
    })
  })

  describe('clearLegacyTimerState', () => {
    it('removes legacy key', () => {
      storage['time-tracker-demo-timer'] = '{}'
      clearLegacyTimerState()
      expect(storage['time-tracker-demo-timer']).toBeUndefined()
    })
  })
})
