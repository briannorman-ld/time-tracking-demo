import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCustomerNames, createCustomer } from '@/lib/customers'

const storedCustomers: Array<{ id: string; userId: string; name: string; createdAt: string }> = []

vi.mock('@/lib/db', () => ({
  db: {
    customers: {
      where: vi.fn((_key: string) => ({
        equals: (userId: string) => ({
          sortBy: () =>
            Promise.resolve(
              storedCustomers.filter((c) => c.userId === userId).sort((a, b) => a.name.localeCompare(b.name))
            ),
          toArray: () => Promise.resolve(storedCustomers.filter((c) => c.userId === userId)),
        }),
      })),
      get: vi.fn((id: string) => Promise.resolve(storedCustomers.find((c) => c.id === id))),
      put: vi.fn(async (c: { id: string; userId: string; name: string; createdAt: string }) => {
        const i = storedCustomers.findIndex((x) => x.id === c.id)
        if (i >= 0) storedCustomers[i] = c
        else storedCustomers.push(c)
      }),
      delete: vi.fn(async (id: string) => {
        const i = storedCustomers.findIndex((c) => c.id === id)
        if (i >= 0) storedCustomers.splice(i, 1)
      }),
    },
  },
}))

vi.mock('@/seed/seedCustomers', () => ({
  ensureCustomersSeeded: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/entries', () => ({
  updateEntriesCustomerName: vi.fn(() => Promise.resolve()),
}))

describe('customers', () => {
  beforeEach(() => {
    storedCustomers.length = 0
  })

  describe('getCustomerNames', () => {
    it('returns names sorted by name', async () => {
      storedCustomers.push(
        { id: '1', userId: 'u1', name: 'Acme', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', userId: 'u1', name: 'Beta', createdAt: '2026-01-01T00:00:00Z' }
      )
      const names = await getCustomerNames('u1')
      expect(names).toEqual(['Acme', 'Beta'])
    })
  })

  describe('createCustomer', () => {
    it('throws when name is empty', async () => {
      await expect(createCustomer('u1', '')).rejects.toThrow('Customer name is required')
      await expect(createCustomer('u1', '   ')).rejects.toThrow('Customer name is required')
    })

    it('returns created customer with trimmed name', async () => {
      const customer = await createCustomer('u1', '  New Co  ')
      expect(customer.userId).toBe('u1')
      expect(customer.name).toBe('New Co')
      expect(customer.id).toBeDefined()
      expect(customer.createdAt).toBeDefined()
    })
  })
})
