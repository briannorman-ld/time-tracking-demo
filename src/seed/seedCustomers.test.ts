import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureCustomersSeeded, SEED_CUSTOMER_NAMES } from '@/seed/seedCustomers'

const stored: Array<{ id: string; userId: string; name: string; createdAt: string }> = []

vi.mock('@/lib/db', () => ({
  db: {
    customers: {
      where: vi.fn((_key: string) => ({
        equals: (userId: string) => ({
          toArray: () => Promise.resolve(stored.filter((c) => c.userId === userId)),
        }),
      })),
      bulkPut: vi.fn(async (rows: typeof stored) => {
        for (const row of rows) {
          const i = stored.findIndex((c) => c.id === row.id)
          if (i >= 0) stored[i] = row
          else stored.push(row)
        }
      }),
    },
  },
}))

describe('seedCustomers', () => {
  beforeEach(() => {
    stored.length = 0
  })

  it('exports SEED_CUSTOMER_NAMES with 10 names', () => {
    expect(SEED_CUSTOMER_NAMES).toHaveLength(10)
    expect(SEED_CUSTOMER_NAMES).toContain('Acme Corp')
    expect(SEED_CUSTOMER_NAMES).toContain('Monsters Inc')
  })

  it('adds all seed customers when none exist', async () => {
    const { db } = await import('@/lib/db')
    await ensureCustomersSeeded('user1')
    expect(db.customers.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user1', name: 'Acme Corp' }),
        expect.objectContaining({ userId: 'user1', name: 'Monsters Inc' }),
      ])
    )
    const call = (db.customers.bulkPut as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call).toHaveLength(10)
  })

  it('adds only missing customers when some exist', async () => {
    stored.push({
      id: 'user2|Acme Corp',
      userId: 'user2',
      name: 'Acme Corp',
      createdAt: new Date().toISOString(),
    })
    const { db } = await import('@/lib/db')
    ;(db.customers.bulkPut as ReturnType<typeof vi.fn>).mockClear()
    await ensureCustomersSeeded('user2')
    const calls = (db.customers.bulkPut as ReturnType<typeof vi.fn>).mock.calls
    expect(calls).toHaveLength(1)
    const call = calls[0][0]
    expect(call).toHaveLength(9)
    expect(call.every((c: { name: string }) => c.name !== 'Acme Corp')).toBe(true)
  })

  it('does not call bulkPut when all seed customers exist', async () => {
    const userId = 'user3'
    for (const name of SEED_CUSTOMER_NAMES) {
      stored.push({
        id: `${userId}|${name}`,
        userId,
        name,
        createdAt: new Date().toISOString(),
      })
    }
    const { db } = await import('@/lib/db')
    ;(db.customers.bulkPut as ReturnType<typeof vi.fn>).mockClear()
    await ensureCustomersSeeded('user3')
    expect(db.customers.bulkPut).not.toHaveBeenCalled()
  })
})
