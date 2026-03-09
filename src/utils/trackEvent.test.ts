import { describe, it, expect } from 'vitest'
import { trackEvent, getRecentEvents } from '@/utils/trackEvent'

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
