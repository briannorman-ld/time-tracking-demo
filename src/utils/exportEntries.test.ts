import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildEntriesCsv, downloadEntriesCsv } from './exportEntries'
import type { TimeEntry } from '@/types/entry'

const mockEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry =>
  ({
    id: 'e1',
    userId: 'u1',
    customer: 'Acme',
    project: '',
    notes: '<p>Meeting</p>',
    date: '2026-03-18',
    durationMinutes: 90,
    createdAt: '2026-03-18T10:00:00',
    updatedAt: '2026-03-18T10:00:00',
    source: 'manual',
    schemaVersion: 2,
    billable: true,
    ...overrides,
  }) as TimeEntry

describe('exportEntries', () => {
  describe('buildEntriesCsv', () => {
    it('returns header and one row for one entry', () => {
      const entries = [mockEntry()]
      const csv = buildEntriesCsv(entries, '2026-03-01', '2026-03-31')
      expect(csv).toContain('Date,Customer,Duration (hours),Duration (min),Notes,Billable')
      expect(csv).toContain('Wednesday, March 18, 2026')
      expect(csv).toContain('Acme')
      expect(csv).toContain('1.5')
      expect(csv).toContain('90')
      expect(csv).toContain('Meeting')
      expect(csv).toContain('Yes')
    })

    it('escapes quotes in notes', () => {
      const entries = [mockEntry({ notes: 'Say "hello"', customer: 'A, B & Co' })]
      const csv = buildEntriesCsv(entries, '2026-03-01', '2026-03-31')
      expect(csv).toContain('"Say ""hello"""')
      expect(csv).toContain('"A, B & Co"')
    })

    it('outputs No for non-billable', () => {
      const entries = [mockEntry({ billable: false })]
      const csv = buildEntriesCsv(entries, '2026-03-01', '2026-03-31')
      expect(csv).toContain('No')
    })
  })

  describe('downloadEntriesCsv', () => {
    let createElement: typeof document.createElement
    let createObjectURL: typeof URL.createObjectURL
    let revokeObjectURL: typeof URL.revokeObjectURL

    beforeEach(() => {
      createElement = vi.spyOn(document, 'createElement')
      createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('creates a link with correct download name and triggers click', () => {
      const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node)
      const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node)
      const mockLink = { href: '', download: '', click: vi.fn() }
      vi.mocked(document.createElement).mockReturnValue(mockLink as unknown as HTMLAnchorElement)

      downloadEntriesCsv([mockEntry()], '2026-03-01', '2026-03-31')

      expect(mockLink.download).toBe('time-entries-2026-03-01-to-2026-03-31.csv')
      expect(mockLink.click).toHaveBeenCalled()
      expect(createObjectURL).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
      appendChild.mockRestore()
      removeChild.mockRestore()
    })
  })

})
