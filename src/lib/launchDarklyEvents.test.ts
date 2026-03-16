import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setLaunchDarklyClient,
  getLaunchDarklyClient,
  trackLaunchDarklyEvent,
  getRecentLaunchDarklyEvents,
  trackTimeEntryCreated,
  trackReportsPageView,
  trackCustomersPageView,
  LD_EVENT_TTD_TIME_ENTRY_CREATED,
  LD_EVENT_TTD_REPORTS_PAGE_VIEW,
  LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW,
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

    it('appends to event log and getRecentLaunchDarklyEvents returns it', () => {
      setLaunchDarklyClient({ track: mockTrack })
      trackLaunchDarklyEvent('log_test', { a: 1 })
      const recent = getRecentLaunchDarklyEvents(5)
      expect(recent.length).toBeGreaterThanOrEqual(1)
      const entry = recent[0]
      expect(entry.eventKey).toBe('log_test')
      expect(entry.data).toEqual({ a: 1 })
      expect(entry.sent).toBe(true)
      expect(entry.ts).toBeDefined()
    })

    it('event log entry has sent: false when client not set', () => {
      setLaunchDarklyClient(null)
      trackLaunchDarklyEvent('no_client_event', { x: 1 })
      const recent = getRecentLaunchDarklyEvents(5)
      const entry = recent.find((e) => e.eventKey === 'no_client_event')
      expect(entry).toBeDefined()
      expect(entry!.sent).toBe(false)
    })
  })

  describe('trackTimeEntryCreated', () => {
    const data = { entryId: 'e1', userId: 'u1', durationMinutes: 30 }

    beforeEach(() => setLaunchDarklyClient({ track: mockTrack }))

    it('sends ttd-time-entry-created and ttd-time-entry-created-timer when source is timer', () => {
      trackTimeEntryCreated('timer', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TTD_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_TIMER, data, undefined)
    })

    it('sends ttd-time-entry-created and ttd-time-entry-created-manual when source is manual', () => {
      trackTimeEntryCreated('manual', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TTD_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data, undefined)
    })

    it('sends ttd-time-entry-created and ttd-time-entry-created-manual when source is import', () => {
      trackTimeEntryCreated('import', data)
      expect(mockTrack).toHaveBeenCalledTimes(2)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TTD_TIME_ENTRY_CREATED, data, undefined)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TIME_ENTRY_CREATED_MANUAL, data, undefined)
    })
  })

  describe('trackReportsPageView', () => {
    it('sends ttd-reports-page-view with no data', () => {
      setLaunchDarklyClient({ track: mockTrack })
      trackReportsPageView()
      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TTD_REPORTS_PAGE_VIEW, undefined, undefined)
    })
  })

  describe('trackCustomersPageView', () => {
    it('sends ttd-customers-page-view with no data', () => {
      setLaunchDarklyClient({ track: mockTrack })
      trackCustomersPageView()
      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW, undefined, undefined)
    })
  })

  describe('event key constants', () => {
    it('match expected LaunchDarkly event keys', () => {
      expect(LD_EVENT_TTD_TIME_ENTRY_CREATED).toBe('ttd-time-entry-created')
      expect(LD_EVENT_TTD_REPORTS_PAGE_VIEW).toBe('ttd-reports-page-view')
      expect(LD_EVENT_TTD_CUSTOMERS_PAGE_VIEW).toBe('ttd-customers-page-view')
      expect(LD_EVENT_TIME_ENTRY_CREATED_TIMER).toBe('ttd-time-entry-created-timer')
      expect(LD_EVENT_TIME_ENTRY_CREATED_MANUAL).toBe('ttd-time-entry-created-manual')
    })
  })
})
