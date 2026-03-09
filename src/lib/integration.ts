/**
 * Generic integration stub: where third-party identify/analytics calls would go.
 * - identifyUser: call your feature-flag / analytics provider's identify method here.
 * - No production SDKs are installed; this is a no-op for the demo.
 *
 * Migration: replace the body with your provider's client.identify(userId, traits).
 */
import type { UserContext } from '@/types/user'
import { trackEvent } from '@/utils/trackEvent'

export function identifyUser(userContext: UserContext): void {
  // STUB: In production, call your feature-flag/analytics SDK here, e.g.:
  // segment.identify(userContext.userId, userContext.traits)
  // launchDarkly.identify({ key: userContext.userId, ... })
  trackEvent('identify_called', { userKey: userContext.userId })
}
