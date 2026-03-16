/**
 * User store: seed users + custom users persisted in localStorage.
 * Used for login dropdown and "create new account".
 */
import { v4 as uuidv4 } from 'uuid'
import type { DemoUser } from '@/types/user'
import { DEMO_USERS } from '@/seed/seedUsers'

const CUSTOM_USERS_KEY = 'time-tracker-demo-custom-users'

function loadCustomUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(CUSTOM_USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DemoUser[]
  } catch {
    return []
  }
}

function saveCustomUsers(users: DemoUser[]): void {
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users))
}

/** Get user by id (seed first, then custom). */
export function getDemoUserById(id: string): DemoUser | undefined {
  const seed = DEMO_USERS.find((u) => u.id === id)
  if (seed) return seed
  return loadCustomUsers().find((u) => u.id === id)
}

/** Get user by username (case-sensitive). */
export function getDemoUserByUsername(username: string): DemoUser | undefined {
  const trimmed = username.trim()
  if (!trimmed) return undefined
  const seed = DEMO_USERS.find((u) => u.username === trimmed)
  if (seed) return seed
  return loadCustomUsers().find((u) => u.username === trimmed)
}

/** All users (seed + custom) for dropdowns. */
export function getAllUsers(): DemoUser[] {
  return [...DEMO_USERS, ...loadCustomUsers()]
}

export interface CreateUserInput {
  username: string
  displayName: string
  email: string
}

/** Create a new user, persist to custom store, return the user. Username must be unique. */
export function createUser(input: CreateUserInput): DemoUser {
  const username = input.username.trim()
  const displayName = input.displayName.trim() || username
  const email = input.email.trim() || `${username}@demo.local`
  if (getDemoUserByUsername(username)) {
    throw new Error(`Username "${username}" is already taken`)
  }
  const custom = loadCustomUsers()
  const newUser: DemoUser = {
    id: `user-custom-${uuidv4()}`,
    username,
    displayName,
    email,
    appRole: 'user',
    planTier: 'free',
    betaTester: false,
    teams: [],
    timezone: 'America/New_York',
    city: '',
    country: 'US',
  }
  custom.push(newUser)
  saveCustomUsers(custom)
  return newUser
}
