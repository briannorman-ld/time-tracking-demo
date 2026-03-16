import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setLaunchDarklyClient,
  getLaunchDarklyClient,
  trackLaunchDarklyEvent,
  trackTimeEntryCreated,
  LD_EVENT_TIME_ENTRY_CREATED,
  LD_EVENT_TIME_ENTRY_CREATED_TIMER,
  LD_EVENT_TIME_ENTRY_CREATED_MANUAL,
} from '@/lib/launchDarklyEvents'

describe('launchDarklyEvents', () => {
  const mockTrack = vi.fn()

  beforeEach(() => {
    mockTrack.mockClear()
    setLaunchDarklyClient(null)
  })

  describe('setLaunchDarklyClient / getLaunchDarklyClient', () => {
    it('stores and returns the client', () => {
      const client = { track: mockTrack }
      expect(getLaunchDarklyClient()).toBeNull()
      setLaunchDarklyClient(client)
      expect(getLaunchDarklyClient()).toBe(client)
      setLaunchDarklyClient(null)
      expect(getLaunchDarklyClient()).toBeNull()
    })
  })

  describe('trackLaunchDarklyEvent', () => {
    it('calls client.track when client is set', () => {
      setLaunchDarklyClient({ track: mockTrack })
      trackLaunchDarklyEvent('custom_event', { foo: 'bar' })
      expect(mockTrack).toHaveBeenCalledWith('custom_event', { foo: 'bar' }, undefined)
    })

    it('does not throw when client is not set', () => {
      expect(() => trackLaunchDarklyEvent('no_client', {})).not.toThrow()
      expect(mockTrack).not.toHaveBeenCalled()
    })

    it('passes metricValue when provided', () => {
      setLaunchDarklyClient({ track: mockTrack })
      trackLaunchDarklyEvent('goal', { id: 'g1' }, 1.5)
      expect(mockTrack).toHaveBeenCalledWith('goal', { id: 'g1' }, 1.5)
    })
  })

  describe('trackTimeEntryCreated', () => {
    const data = { entryId: 'e1', userId: 'u1', durationMinutes: 30 }

    beforeEach(() => setLaunchDarklyClient({ track: mockTrack }))

    it('sends time_entry_created and time_entry_created_timer when source is timer', () => {
      trackTimeEntryCreated('timer', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_TIMER, data, undefined)
    })

    it('sends time_entry_created and time_entry_created_manual when source is manual', () => {
      trackTimeEntryCreated('manual', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data, undefined)
    })

    it('sends time_entry_created and time_entry_created_manual when source is import', () => {
      trackTimeEntryCreated('import', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data, undefined)
    })
  })

  describe('event key constants', () => {
    it('match expected LaunchDarkly event keys', () => {
      expect(LD_EVENT_TIME_ENTRY_CREATED).toBe('time_entry_created')
      expect(LD_EVENT_TIME_ENTRY_CREATED_TIMER).toBe('time_entry_created_timer')
      expect(LD_EVENT_TIME_ENTRY_CREATED_MANUAL).toBe('time_entry_created_manual')
    })
  })
})
