import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimeEntries } from './TimeEntries'

vi.mock('launchdarkly-react-client-sdk', () => ({
  useFlags: vi.fn(),
}))

vi.mock('@/context/SessionContext', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/context/TimerContext', () => ({
  useTimer: vi.fn(),
}))

vi.mock('@/context/TimeTotalsInvalidatorContext', () => ({
  useTimeTotalsInvalidate: vi.fn(() => vi.fn()),
  useTimeTotalsInvalidatorVersion: vi.fn(() => 0),
}))

vi.mock('@/lib/entries', () => ({
  getEntriesByUserAndDate: vi.fn(() => Promise.resolve([])),
  getEntriesByUserInRange: vi.fn(() => Promise.resolve([])),
  getEntry: vi.fn(() => Promise.resolve(null)),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}))

vi.mock('@/lib/customers', () => ({
  getCustomerNames: vi.fn(() => Promise.resolve([])),
  createCustomer: vi.fn(),
}))

vi.mock('@/lib/preferences', () => ({
  getRoundingPreference: vi.fn(() => 0),
  roundToNearest: vi.fn((n: number) => n),
}))

vi.mock('@/utils/trackEvent', () => ({
  trackEvent: vi.fn(),
}))

async function getMocks() {
  const { useFlags } = await import('launchdarkly-react-client-sdk')
  const { useSession } = await import('@/context/SessionContext')
  const { useTimer } = await import('@/context/TimerContext')
  return {
    useFlags: useFlags as ReturnType<typeof vi.fn>,
    useSession: useSession as ReturnType<typeof vi.fn>,
    useTimer: useTimer as ReturnType<typeof vi.fn>,
  }
}

describe('TimeEntries', () => {
  beforeEach(async () => {
    const { useSession, useTimer, useFlags } = await getMocks()
    vi.mocked(useSession).mockReturnValue({ user: { id: 'user-1' } } as never)
    vi.mocked(useTimer).mockReturnValue({
      activeTimers: [],
      resume: vi.fn(),
      pause: vi.fn(),
      start: vi.fn(),
      startWith: vi.fn(),
      addPausedTimer: vi.fn(),
      updateTimer: vi.fn(),
      getElapsedSec: vi.fn(() => 0),
      draftCustomer: '',
      draftNotes: '',
      setDraftCustomer: vi.fn(),
      setDraftNotes: vi.fn(),
    } as never)
    vi.mocked(useFlags).mockReturnValue({ 'tile-layout': false })
  })

  it('renders list layout (ul) when tile-layout flag is false', async () => {
    const { useFlags } = await getMocks()
    vi.mocked(useFlags).mockReturnValue({ 'tile-layout': false })
    render(<TimeEntries />)
    await screen.findByRole('list', { hidden: true })
    expect(document.querySelector('.time-entries-tiles')).not.toBeInTheDocument()
    expect(document.querySelector('ul')).toBeInTheDocument()
  })

  it('renders tile layout when tile-layout flag is true', async () => {
    const { useFlags } = await getMocks()
    vi.mocked(useFlags).mockReturnValue({ 'tile-layout': true })
    render(<TimeEntries />)
    expect(document.querySelector('.time-entries-tiles')).toBeInTheDocument()
    expect(document.querySelector('.time-entries-tiles-grid')).toBeInTheDocument()
  })

  it('accepts camelCase tileLayout from useFlags', async () => {
    const { useFlags } = await getMocks()
    vi.mocked(useFlags).mockReturnValue({ tileLayout: true })
    render(<TimeEntries />)
    expect(document.querySelector('.time-entries-tiles')).toBeInTheDocument()
  })
})
