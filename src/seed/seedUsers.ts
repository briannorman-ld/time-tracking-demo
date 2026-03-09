/**
 * Seed demo users for passwordless auth.
 * In production, users would come from your IdP; this is for local learning only.
 */
import type { DemoUser } from '@/types/user'

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-brian-norman',
    username: 'bnorman',
    displayName: 'Brian',
    email: 'brian@demo.local',
    appRole: 'admin',
    planTier: 'premium',
    betaTester: true,
    teams: ['Enterprise SE', 'Field Engineering'],
    timezone: 'America/Denver',
    city: 'Denver',
    country: 'US',
  },
  {
    id: 'user-alex',
    username: 'alex',
    displayName: 'Alex',
    email: 'alex@demo.local',
    appRole: 'user',
    planTier: 'pro',
    betaTester: false,
    teams: ['Engineering'],
    timezone: 'America/Los_Angeles',
    city: 'San Francisco',
    country: 'US',
  },
  {
    id: 'user-priya',
    username: 'priya',
    displayName: 'Priya',
    email: 'priya@demo.local',
    appRole: 'user',
    planTier: 'enterprise',
    betaTester: true,
    teams: ['Product', 'Engineering'],
    timezone: 'Asia/Kolkata',
    city: 'Mumbai',
    country: 'IN',
  },
  {
    id: 'user-marco',
    username: 'marco',
    displayName: 'Marco',
    email: 'marco@demo.local',
    appRole: 'user',
    planTier: 'pro',
    betaTester: false,
    teams: ['Sales'],
    timezone: 'Europe/Rome',
    city: 'Rome',
    country: 'IT',
  },
  {
    id: 'user-jen',
    username: 'jen',
    displayName: 'Jen',
    email: 'jen@demo.local',
    appRole: 'viewer',
    planTier: 'free',
    betaTester: false,
    teams: [],
    timezone: 'America/New_York',
    city: 'New York',
    country: 'US',
  },
]

export function getDemoUserById(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id)
}
