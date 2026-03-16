import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEntry, updateEntry, deleteEntry } from '@/lib/entries'
import type { TimeEntry } from '@/types/entry'
import { SCHEMA_VERSION } from '@/types/entry'
import {
  trackTimeEntryCreated,
} from '@/lib/launchDarklyEvents'

vi.mock('@/utils/trackEvent', () => ({ trackEvent: vi.fn() }))
vi.mock('@/lib/launchDarklyEvents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/launchDarklyEvents')>()
  return {
    ...actual,
    trackTimeEntryCreated: vi.fn(),
  }
})

const addedEntries: TimeEntry[] = []
const storedEntries: Map<string, TimeEntry> = new Map()

const mockEntries = {
  add: vi.fn(async (entry: TimeEntry) => {
    addedEntries.push(entry)
    storedEntries.set(entry.id, entry)
  }),
  put: vi.fn(async (entry: TimeEntry) => {
    storedEntries.set(entry.id, entry)
  }),
  get: vi.fn(async (id: string) => storedEntries.get(id)),
  delete: vi.fn(async (id: string) => {
    storedEntries.delete(id)
  }),
  where: vi.fn((_key: string) => ({
    equals: (val: string | [string, string]) => ({
      sortBy: (_sortKey: string) => {
        const list = Array.from(storedEntries.values()).filter((e) =>
          Array.isArray(val) ? e.userId === val[0] && e.date === val[1] : e.userId === val
        )
        return Promise.resolve(list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
      },
      toArray: () => {
        const list = Array.from(storedEntries.values()).filter((e) =>
          Array.isArray(val) ? e.userId === val[0] && e.date === val[1] : e.userId === val
        )
        return Promise.resolve(list)
      },
    }),
  })),
}

vi.mock('@/lib/db', () => ({
  db: { entries: mockEntries },
}))

describe('entries', () => {
  beforeEach(() => {
    addedEntries.length = 0
    storedEntries.clear()
    vi.mocked(trackTimeEntryCreated).mockClear()
  })

  describe('createEntry', () => {
    it('returns entry with required fields and defaults', async () => {
      const entry = await createEntry('u1', {
        customer: 'Acme',
        project: 'P1',
        notes: 'n',
        date: '2026-01-15',
        durationMinutes: 60,
        source: 'manual',
      })
      expect(entry.userId).toBe('u1')
      expect(entry.customer).toBe('Acme')
      expect(entry.project).toBe('P1')
      expect(entry.notes).toBe('n')
      expect(entry.date).toBe('2026-01-15')
      expect(entry.durationMinutes).toBe(60)
      expect(entry.source).toBe('manual')
      expect(entry.id).toBeDefined()
      expect(entry.schemaVersion).toBe(SCHEMA_VERSION)
      expect(entry.billable).toBe(true)
    })

    it('sends timer and any-created events when source is timer', async () => {
      const entry = await createEntry('u1', {
        customer: 'Acme',
        notes: 'Work',
        date: '2026-02-01',
        durationMinutes: 45,
        source: 'timer',
      })
      expect(trackTimeEntryCreated).toHaveBeenCalledWith(
        'timer',
        expect.objectContaining({
          entryId: entry.id,
          userId: 'u1',
          customer: 'Acme',
          durationMinutes: 45,
          source: 'timer',
          date: '2026-02-01',
        })
      )
    })

    it('sends manual and any-created events when source is manual', async () => {
      const entry = await createEntry('u1', {
        customer: 'Beta',
        notes: 'Manual',
        date: '2026-02-02',
        durationMinutes: 60,
        source: 'manual',
      })
      expect(trackTimeEntryCreated).toHaveBeenCalledWith(
        'manual',
        expect.objectContaining({
          entryId: entry.id,
          userId: 'u1',
          customer: 'Beta',
          durationMinutes: 60,
          source: 'manual',
          date: '2026-02-02',
        })
      )
    })
  })

  describe('updateEntry', () => {
    it('returns undefined when entry not found', async () => {
      const result = await updateEntry('nonexistent', 'u1', { customer: 'X' })
      expect(result).toBeUndefined()
    })

    it('returns undefined when entry belongs to different user', async () => {
      await createEntry('u1', {
        customer: 'A',
        notes: '',
        date: '2026-01-01',
        durationMinutes: 30,
      })
      const id = addedEntries[0].id
      const result = await updateEntry(id, 'u2', { customer: 'X' })
      expect(result).toBeUndefined()
    })
  })

  describe('deleteEntry', () => {
    it('returns false when entry not found', async () => {
      expect(await deleteEntry('nonexistent', 'u1')).toBe(false)
    })
  })
})
