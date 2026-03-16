import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDeviceKey,
  buildLaunchDarklyContext,
} from '@/lib/launchDarklyContext'
import type { DemoUser } from '@/types/user'

const STORAGE_KEY = 'ld_device_key'

describe('launchDarklyContext', () => {
  let storage: Record<string, string>

  beforeEach(() => {
    storage = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
    })
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-1234',
    })
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
    })
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
  })

  describe('getDeviceKey', () => {
    it('returns existing key from localStorage', () => {
      storage[STORAGE_KEY] = 'device-existing'
      expect(getDeviceKey()).toBe('device-existing')
    })

    it('generates and stores a new key when missing', () => {
      expect(getDeviceKey()).toBe('device-test-uuid-1234')
      expect(storage[STORAGE_KEY]).toBe('device-test-uuid-1234')
    })

    it('returns same key on subsequent calls', () => {
      const first = getDeviceKey()
      const second = getDeviceKey()
      expect(first).toBe(second)
    })

    it('returns device-unknown when localStorage is missing', () => {
      vi.stubGlobal('localStorage', undefined)
      expect(getDeviceKey()).toBe('device-unknown')
    })
  })

  describe('buildLaunchDarklyContext', () => {
    it('returns multi-kind context with anonymous user and device when user is null', () => {
      const ctx = buildLaunchDarklyContext(null)
      expect(ctx.kind).toBe('multi')
      expect(ctx).toHaveProperty('user')
      expect(ctx).toHaveProperty('device')
      expect((ctx as { user: { key: string; anonymous: boolean } }).user).toEqual({
        key: 'anonymous',
        anonymous: true,
      })
      expect((ctx as { device: { key: string; type: string; browser: string; operatingSystem: string; screenSize: string } }).device).toMatchObject({
        key: 'device-test-uuid-1234',
        type: 'desktop',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        screenSize: '1920x1080',
      })
    })

    it('returns multi-kind context with user and device when user is provided', () => {
      const user: DemoUser = {
        id: 'user-1',
        username: 'alice',
        displayName: 'Alice',
        email: 'alice@example.com',
        appRole: 'user',
        planTier: 'pro',
        betaTester: false,
        teams: ['eng'],
        timezone: 'America/New_York',
        city: 'New York',
        country: 'US',
      }
      const ctx = buildLaunchDarklyContext(user)
      expect(ctx.kind).toBe('multi')
      expect((ctx as { user: Record<string, unknown> }).user).toEqual({
        key: 'user-1',
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        country: 'US',
        membershipType: 'premium',
      })
      expect((ctx as { device: { key: string } }).device.key).toBe(
        'device-test-uuid-1234'
      )
      expect((ctx as { device: { type: string; browser: string; operatingSystem: string; screenSize: string } }).device).toMatchObject({
        type: 'desktop',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        screenSize: '1920x1080',
      })
    })

    it('includes device type (desktop, mobile, tablet, tv) in device context', () => {
      const ctx = buildLaunchDarklyContext(null)
      const device = (ctx as { device: { type: string } }).device
      expect(['desktop', 'mobile', 'tablet', 'tv', 'unknown']).toContain(device.type)
      expect(device.type).toBe('desktop')
    })

    it('uses device key from storage in context', () => {
      storage[STORAGE_KEY] = 'device-persisted'
      const ctx = buildLaunchDarklyContext(null)
      expect((ctx as { device: { key: string } }).device.key).toBe(
        'device-persisted'
      )
    })

    it('maps planTier to membershipType (free -> free, pro/enterprise -> premium)', () => {
      const freeUser: DemoUser = {
        id: 'free-1',
        username: 'free',
        displayName: 'Free User',
        email: 'free@example.com',
        appRole: 'user',
        planTier: 'free',
        betaTester: false,
        teams: [],
        timezone: 'UTC',
        city: 'Unknown',
      }
      const ctx = buildLaunchDarklyContext(freeUser)
      expect((ctx as { user: { membershipType: string } }).user.membershipType).toBe('free')
    })

    it('includes phone and age when present', () => {
      const user: DemoUser = {
        id: 'u2',
        username: 'bob',
        displayName: 'Bob',
        email: 'bob@example.com',
        phone: '+1-555-0100',
        age: 28,
        appRole: 'user',
        planTier: 'enterprise',
        betaTester: false,
        teams: [],
        timezone: 'UTC',
        city: 'Boston',
        country: 'US',
      }
      const ctx = buildLaunchDarklyContext(user)
      expect((ctx as { user: Record<string, unknown> }).user).toMatchObject({
        phone: '+1-555-0100',
        age: 28,
        country: 'US',
        membershipType: 'premium',
      })
    })

    it('omits country from context when user has no country', () => {
      const user: DemoUser = {
        id: 'u3',
        username: 'noland',
        displayName: 'No Land',
        email: 'noland@example.com',
        appRole: 'user',
        planTier: 'free',
        betaTester: false,
        teams: [],
        timezone: 'UTC',
        city: 'Unknown',
      }
      const ctx = buildLaunchDarklyContext(user)
      expect((ctx as { user: Record<string, unknown> }).user).not.toHaveProperty('country')
    })
  })
})
