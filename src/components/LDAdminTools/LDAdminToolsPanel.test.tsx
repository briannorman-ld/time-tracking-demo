import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeTotalsInvalidatorProvider } from '@/context/TimeTotalsInvalidatorContext'
import { useDashboardFocusDate } from '@/context/DashboardFocusDateContext'
import { LDAdminToolsPanel } from './LDAdminToolsPanel'

vi.mock('@/context/DashboardFocusDateContext', () => ({
  useDashboardFocusDate: vi.fn(),
}))

const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
  planTier: 'free' as const,
}

const seedLdDemoTimeEntries = vi.fn()

const { mockAddPausedTimer } = vi.hoisted(() => ({
  mockAddPausedTimer: vi.fn(),
}))

vi.mock('@/context/TimerContext', () => ({
  useTimer: () =>
    ({
      draftCustomer: '',
      draftNotes: '',
      setDraftCustomer: vi.fn(),
      setDraftNotes: vi.fn(),
      start: vi.fn(),
      startWith: vi.fn(),
      activeTimers: [],
      pause: vi.fn(),
      resume: vi.fn(),
      addPausedTimer: mockAddPausedTimer,
      updateTimer: vi.fn(),
      getElapsedSec: vi.fn(() => 0),
    }) as ReturnType<typeof import('@/context/TimerContext').useTimer>,
}))

vi.mock('@/lib/seedLdDemoTimeEntries', () => ({
  seedLdDemoTimeEntries: (...args: unknown[]) => seedLdDemoTimeEntries(...args),
}))

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ user: mockUser }),
}))

describe('LDAdminToolsPanel', () => {
  const onClose = vi.fn()

  function renderPanel() {
    return render(
      <TimeTotalsInvalidatorProvider>
        <LDAdminToolsPanel onClose={onClose} />
      </TimeTotalsInvalidatorProvider>
    )
  }

  beforeEach(() => {
    onClose.mockClear()
    mockAddPausedTimer.mockClear()
    seedLdDemoTimeEntries.mockResolvedValue(7)
    vi.mocked(useDashboardFocusDate).mockReturnValue({
      focusDate: '2030-06-15',
      setFocusDate: vi.fn(),
    })
  })

  it('renders panel with title and close button', () => {
    renderPanel()
    expect(screen.getByRole('dialog', { name: /launchdarkly admin tools/i })).toBeInTheDocument()
    expect(screen.getByText('LD Admin Tools')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('shows current context section with user context', () => {
    renderPanel()
    expect(screen.getByText('Current context')).toBeInTheDocument()
    expect(screen.getByText(/user \+ device context/i)).toBeInTheDocument()
    expect(screen.getByText(/"key": "user-1"/)).toBeInTheDocument()
  })

  it('shows event log section', () => {
    renderPanel()
    expect(screen.getByText('Event log')).toBeInTheDocument()
    const eventLogSection = screen.getByRole('heading', { name: 'Event log' }).closest('section')
    expect(eventLogSection).toBeInTheDocument()
    expect(eventLogSection?.textContent).toMatch(/recent.*track.*events/i)
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('seeds time entries for dashboard focus date when footer button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /^seed time entries$/i }))
    expect(seedLdDemoTimeEntries).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        date: '2030-06-15',
        registerAsPausedTimer: expect.any(Function),
      })
    )
    expect(await screen.findByText(/added 7 time entries/i)).toBeInTheDocument()
  })
})
