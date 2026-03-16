/**
 * Demo user type. In production, this would come from your auth provider.
 * No passwords — passwordless demo auth only.
 */
export interface DemoUser {
  id: string
  username: string
  displayName: string
  email: string
  phone?: string
  appRole: 'admin' | 'user' | 'viewer'
  planTier: 'free' | 'pro' | 'premium' | 'enterprise'
  betaTester: boolean
  teams: string[]
  timezone: string
  city: string
  country?: string
  age?: number
}

/** Context passed to integration.identifyUser() — mirrors what analytics/feature-flag providers expect. */
export interface UserContext {
  userId: string
  username: string
  displayName: string
  email: string
  traits?: Record<string, unknown>
}

export function userToContext(user: DemoUser): UserContext {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    traits: {
      appRole: user.appRole,
      planTier: user.planTier,
      betaTester: user.betaTester,
      teams: user.teams,
      timezone: user.timezone,
      city: user.city,
    },
  }
}
