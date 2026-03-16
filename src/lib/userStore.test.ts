import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDemoUserById,
  getDemoUserByUsername,
  getAllUsers,
  createUser,
} from '@/lib/userStore'

const CUSTOM_USERS_KEY = 'time-tracker-demo-custom-users'

describe('userStore', () => {
  beforeEach(() => {
    localStorage.removeItem(CUSTOM_USERS_KEY)
  })

  describe('getDemoUserById', () => {
    it('returns seed user by id', () => {
      const u = getDemoUserById('user-alex')
      expect(u).toBeDefined()
      expect(u?.username).toBe('alex')
      expect(u?.displayName).toBe('Alex')
    })

    it('returns undefined for unknown id when no custom users', () => {
      expect(getDemoUserById('user-unknown')).toBeUndefined()
    })

    it('returns custom user by id after createUser', () => {
      const created = createUser({
        username: 'newuser',
        displayName: 'New User',
        email: 'new@demo.local',
      })
      const u = getDemoUserById(created.id)
      expect(u).toEqual(created)
    })
  })

  describe('getDemoUserByUsername', () => {
    it('returns seed user by username', () => {
      const u = getDemoUserByUsername('bnorman')
      expect(u).toBeDefined()
      expect(u?.displayName).toBe('Brian')
    })

    it('returns undefined for empty or unknown username', () => {
      expect(getDemoUserByUsername('')).toBeUndefined()
      expect(getDemoUserByUsername('   ')).toBeUndefined()
      expect(getDemoUserByUsername('nobody')).toBeUndefined()
    })

    it('returns custom user by username after createUser', () => {
      createUser({
        username: 'custom1',
        displayName: 'Custom One',
        email: 'c1@demo.local',
      })
      const u = getDemoUserByUsername('custom1')
      expect(u).toBeDefined()
      expect(u?.displayName).toBe('Custom One')
    })
  })

  describe('getAllUsers', () => {
    it('returns seed users when no custom users', () => {
      const all = getAllUsers()
      expect(all.length).toBeGreaterThanOrEqual(5)
      expect(all.some((u) => u.username === 'alex')).toBe(true)
    })

    it('includes custom users after createUser', () => {
      const before = getAllUsers().length
      createUser({
        username: 'added',
        displayName: 'Added User',
        email: 'added@demo.local',
      })
      const all = getAllUsers()
      expect(all.length).toBe(before + 1)
      expect(all.some((u) => u.username === 'added')).toBe(true)
    })
  })

  describe('createUser', () => {
    it('creates user with required fields and defaults', () => {
      const u = createUser({
        username: 'jdoe',
        displayName: 'Jane Doe',
        email: 'jane@example.com',
      })
      expect(u.id).toMatch(/^user-custom-/)
      expect(u.username).toBe('jdoe')
      expect(u.displayName).toBe('Jane Doe')
      expect(u.email).toBe('jane@example.com')
      expect(u.appRole).toBe('user')
      expect(u.planTier).toBe('free')
      expect(u.betaTester).toBe(false)
      expect(u.teams).toEqual([])
    })

    it('trims and fills optional display name and email', () => {
      const u = createUser({
        username: 'minimal',
        displayName: '',
        email: '',
      })
      expect(u.displayName).toBe('minimal')
      expect(u.email).toBe('minimal@demo.local')
    })

    it('throws when username is already taken (seed)', () => {
      expect(() =>
        createUser({
          username: 'alex',
          displayName: 'Another Alex',
          email: 'alex2@demo.local',
        })
      ).toThrow(/already taken/)
    })

    it('throws when username is already taken (custom)', () => {
      createUser({
        username: 'unique',
        displayName: 'First',
        email: 'first@demo.local',
      })
      expect(() =>
        createUser({
          username: 'unique',
          displayName: 'Second',
          email: 'second@demo.local',
        })
      ).toThrow(/already taken/)
    })

    it('persists custom user in localStorage', () => {
      const u = createUser({
        username: 'persist',
        displayName: 'Persist',
        email: 'p@demo.local',
      })
      const raw = localStorage.getItem(CUSTOM_USERS_KEY)
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!) as Array<{ id: string; username: string }>
      expect(parsed.some((x) => x.id === u.id && x.username === 'persist')).toBe(true)
    })
  })
})
