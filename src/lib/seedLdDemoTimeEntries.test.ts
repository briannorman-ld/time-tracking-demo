import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TimeEntry } from '@/types/entry'
import { SCHEMA_VERSION } from '@/types/entry'
import { LD_DEMO_TIME_ENTRY_SEEDS, seedLdDemoTimeEntries } from '@/lib/seedLdDemoTimeEntries'

const createCustomer = vi.fn()
const createEntry = vi.fn()

function fakeEntry(overrides: Partial<TimeEntry>): TimeEntry {
  return {
    id: 'id',
    userId: 'u1',
    customer: 'c',
    notes: 'n',
    date: '2026-04-13',
    durationMinutes: 60,
    createdAt: 't',
    updatedAt: 't',
    source: 'manual',
    schemaVersion: SCHEMA_VERSION,
    ...overrides,
  }
}

vi.mock('@/lib/customers', () => ({
  createCustomer: (...args: unknown[]) => createCustomer(...args),
}))

vi.mock('@/lib/entries', () => ({
  createEntry: (...args: unknown[]) => createEntry(...args),
}))

describe('seedLdDemoTimeEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createCustomer.mockReset()
    createEntry.mockReset()
    createCustomer.mockResolvedValue({})
    createEntry.mockResolvedValue({})
  })

  it('returns the number of seeded rows', async () => {
    const n = await seedLdDemoTimeEntries('u1', { date: '2026-04-13' })
    expect(n).toBe(LD_DEMO_TIME_ENTRY_SEEDS.length)
  })

  it('creates customer then entry for each seed in order', async () => {
    await seedLdDemoTimeEntries('u1', { date: '2026-04-13' })

    expect(createCustomer.mock.calls.length).toBe(LD_DEMO_TIME_ENTRY_SEEDS.length)
    expect(createEntry.mock.calls.length).toBe(LD_DEMO_TIME_ENTRY_SEEDS.length)

    LD_DEMO_TIME_ENTRY_SEEDS.forEach((row, i) => {
      expect(createCustomer.mock.calls[i]).toEqual([ 'u1', row.customer ])
      expect(createEntry.mock.calls[i]?.[0]).toBe('u1')
      expect(createEntry.mock.calls[i]?.[1]).toMatchObject({
        customer: row.customer,
        notes: row.notes,
        date: '2026-04-13',
        durationMinutes: Math.round(row.hours * 60),
        source: 'manual',
      })
    })
  })

  it('calls registerAsPausedTimer with each created entry when provided', async () => {
    const registerAsPausedTimer = vi.fn()
    let n = 0
    createEntry.mockImplementation(async (_uid, params) =>
      fakeEntry({
        id: `entry-${n++}`,
        customer: params.customer,
        notes: params.notes,
        date: params.date,
        durationMinutes: params.durationMinutes,
      })
    )

    await seedLdDemoTimeEntries('u1', {
      date: '2026-04-13',
      registerAsPausedTimer,
    })

    expect(registerAsPausedTimer).toHaveBeenCalledTimes(LD_DEMO_TIME_ENTRY_SEEDS.length)
    LD_DEMO_TIME_ENTRY_SEEDS.forEach((row, i) => {
      expect(registerAsPausedTimer.mock.calls[i]?.[0]).toMatchObject({
        customer: row.customer,
        notes: row.notes,
        date: '2026-04-13',
        durationMinutes: Math.round(row.hours * 60),
      })
    })
  })
})
