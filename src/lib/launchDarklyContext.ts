/**
 * LaunchDarkly multi-kind context: user + device.
 * Used at init and when identifying so flags can target by user and/or device.
 */

import type { LDContext } from 'launchdarkly-react-client-sdk'
import type { DemoUser } from '@/types/user'

const DEVICE_KEY_STORAGE = 'ld_device_key'

/**
 * Returns a stable key for the current device (browser). Persists in localStorage.
 */
export function getDeviceKey(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'device-unknown'
  }
  let key = window.localStorage.getItem(DEVICE_KEY_STORAGE)
  if (!key) {
    key = `device-${crypto.randomUUID()}`
    window.localStorage.setItem(DEVICE_KEY_STORAGE, key)
  }
  return key
}

/**
 * Builds a LaunchDarkly multi-kind context with "user" and "device" kinds.
 * When user is null, the user kind is anonymous so the SDK still has a valid context.
 * When userKeyOverride is provided (e.g. from LD Admin Tools "Randomize user key"), the user
 * kind uses that key instead of user.id so you can test different targeting evaluations.
 */
export function buildLaunchDarklyContext(
  user: DemoUser | null,
  userKeyOverride?: string | null
): LDContext {
  const deviceKey = getDeviceKey()
  const deviceContext = {
    key: deviceKey,
    type: getDeviceType(),
    browser: getBrowserName(),
    operatingSystem: getOperatingSystem(),
    screenSize: getScreenSize(),
  }

  const userContext = user
    ? {
        key: userKeyOverride ?? user.id,
        id: userKeyOverride ?? user.id,
        name: user.displayName,
        email: user.email,
        ...(user.phone != null && { phone: user.phone }),
        ...(user.country != null && user.country !== '' && { country: user.country }),
        membershipType: user.planTier === 'free' ? 'free' : ('premium' as const),
        ...(user.age != null && { age: user.age }),
      }
    : {
        key: 'anonymous',
        anonymous: true as const,
      }

  return {
    kind: 'multi',
    user: userContext,
    device: deviceContext,
  }
}

function getDeviceType(): string {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  const width = window.screen?.width ?? 0
  if (ua.includes('tv') || ua.includes('smarttv') || ua.includes('googletv') || ua.includes('appletv') || ua.includes('crkey')) return 'tv'
  if (ua.includes('tablet') || ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile')) || (ua.includes('silk') && !ua.includes('mobile'))) return 'tablet'
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('ipod') || ua.includes('android')) return 'mobile'
  if (width > 0 && width < 768) return 'mobile'
  if (width >= 768 && width < 1024) return 'tablet'
  return 'desktop'
}

function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  return 'browser'
}

function getOperatingSystem(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  return 'unknown'
}

function getScreenSize(): string {
  if (typeof window === 'undefined' || !window.screen) return 'unknown'
  const { width, height } = window.screen
  return `${width}x${height}`
}
