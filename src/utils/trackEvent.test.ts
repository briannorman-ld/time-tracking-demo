import { describe, it, expect, vi } from 'vitest'
import { trackEvent, getRecentEvents } from '@/utils/trackEvent'

vi.mock('@/lib/db', () => ({
  db: {
    eventLog: {
      orderBy: () => ({
        reverse: () => ({
          limit: () => ({
            toArray: () => Promise.resolve([]),
          }),
        }),
      }),
      bulkAdd: vi.fn(() => Promise.resolve()),
    },
  },
}))

describe('trackEvent', () => {
  it('calls trackEvent without throwing', () => {
    expect(() => trackEvent('test_event')).not.toThrow()
    expect(() => trackEvent('test_event', { foo: 'bar' })).not.toThrow()
  })
})

describe('getRecentEvents', () => {
  it('returns an array', async () => {
    const events = await getRecentEvents(10)
    expect(Array.isArray(events)).toBe(true)
  })
})
