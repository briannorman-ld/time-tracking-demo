import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimerProvider, useTimer } from '@/context/TimerContext'
import { trackLaunchDarklyEvent, LD_EVENT_TIMER_STARTED } from '@/lib/launchDarklyEvents'
import { formatDateLocal, toLocalISOTimestamp } from '@/utils/dateFormat'

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ user: { id: 'test-user' } }),
}))

vi.mock('@/lib/launchDarklyEvents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/launchDarklyEvents')>()
  return { ...actual, trackLaunchDarklyEvent: vi.fn() }
})

const { mockCreateEntry, saveActiveTimers, clearTimerState, loadLegacyTimerState, clearLegacyTimerState, mockInvalidateTotals } = vi.hoisted(() => ({
  mockCreateEntry: vi.fn((_userId?: string, _params?: unknown) =>
    Promise.resolve({
      id: 'mock-entry-id',
      userId: 'test-user',
      customer: 'Acme',
      project: '',
      notes: '',
      date: formatDateLocal(new Date()),
      durationMinutes: 0,
      createdAt: toLocalISOTimestamp(),
      updatedAt: toLocalISOTimestamp(),
      source: 'timer',
      schemaVersion: 2,
      billable: true,
    })
  ),
  saveActiveTimers: vi.fn(),
  clearTimerState: vi.fn(),
  loadLegacyTimerState: vi.fn(() => null),
  clearLegacyTimerState: vi.fn(),
  mockInvalidateTotals: vi.fn(),
}))

vi.mock('@/lib/entries', () => ({
  createEntry: (userId: string, params: object) => mockCreateEntry(userId, params),
}))

vi.mock('@/utils/timerStorage', () => ({
  loadActiveTimers: () => [],
  saveActiveTimers,
  clearTimerState,
  loadLegacyTimerState,
  clearLegacyTimerState,
}))

vi.mock('@/context/TimeTotalsInvalidatorContext', () => ({
  useTimeTotalsInvalidate: () => mockInvalidateTotals,
}))

function TestConsumer() {
  const {
    draftCustomer,
    draftNotes,
    setDraftCustomer,
    setDraftNotes,
    start,
    activeTimers,
    pause,
    resume,
    addPausedTimer,
    updateTimer,
    getElapsedSec,
  } = useTimer()
  return (
    <div>
      <input
        data-testid="draft-customer"
        value={draftCustomer}
        onChange={(e) => setDraftCustomer(e.target.value)}
      />
      <input
        data-testid="draft-notes"
        value={draftNotes}
        onChange={(e) => setDraftNotes(e.target.value)}
      />
      <button type="button" onClick={start}>
        Start Timer
      </button>
      <button
        type="button"
        onClick={() =>
          addPausedTimer({
            id: 'manual-entry-1',
            userId: 'test-user',
            customer: 'Manual Co',
            notes: 'Manual entry',
            date: '2025-03-16',
            durationMinutes: 30,
            createdAt: toLocalISOTimestamp(),
            updatedAt: toLocalISOTimestamp(),
            source: 'manual',
            schemaVersion: 2,
          })
        }
      >
        Add manual as paused
      </button>
      <div data-testid="active-count">{activeTimers.length}</div>
      {activeTimers.map((t) => (
        <div key={t.id} data-testid={`timer-${t.id}`}>
          <span data-testid={`timer-customer-${t.id}`}>{t.customer}</span>
          <span data-testid={`timer-status-${t.id}`}>{t.status}</span>
          <span data-testid={`timer-elapsed-${t.id}`}>{getElapsedSec(t.id)}</span>
          <button type="button" onClick={() => pause(t.id)}>
            Pause
          </button>
          <button type="button" onClick={() => resume(t.id)}>
            Resume
          </button>
          <button type="button" onClick={() => updateTimer(t.id, { customer: 'Updated' })}>
            Update
          </button>
        </div>
      ))}
    </div>
  )
}

describe('TimerContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts a timer from draft and clears draft', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    expect(screen.getByTestId('active-count')).toHaveTextContent('1')
    expect(screen.getByTestId('draft-customer')).toHaveValue('')
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-customer-${timerId}`)).toHaveTextContent('Acme')
    expect(screen.getByTestId(`timer-status-${timerId}`)).toHaveTextContent('running')
    expect(trackLaunchDarklyEvent).toHaveBeenCalledWith(
      LD_EVENT_TIMER_STARTED,
      expect.objectContaining({
        userId: 'test-user',
        customer: 'Acme',
        entryId: 'mock-entry-id',
      })
    )
    expect(vi.mocked(trackLaunchDarklyEvent).mock.calls[0][1]).toHaveProperty('timerId', timerId)
  })

  it('does not start when draft customer is empty', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    expect(screen.getByTestId('active-count')).toHaveTextContent('0')
  })

  it('pause sets timer status to paused', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    const pauseButtons = screen.getAllByRole('button', { name: 'Pause' })
    await user.click(pauseButtons[0])
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-status-${timerId}`)).toHaveTextContent('paused')
  })

  it('resume sets timer status back to running', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-status-${timerId}`)).toHaveTextContent('running')
  })

  it('updateTimer updates customer name', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    await user.click(screen.getByRole('button', { name: 'Update' }))
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-customer-${timerId}`)).toHaveTextContent('Updated')
  })

  it('getElapsedSec returns a number for active timer', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    const elapsedEl = screen.getByTestId(`timer-elapsed-${timerId}`)
    expect(Number(elapsedEl.textContent)).toBeGreaterThanOrEqual(0)
  })

  it('persists timers via saveActiveTimers when user and activeTimers exist', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.type(screen.getByTestId('draft-customer'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Start Timer' }))
    await screen.findByText('running', {}, { timeout: 2000 })
    expect(saveActiveTimers).toHaveBeenCalled()
  })

  it('addPausedTimer adds entry as paused timer with duration as elapsed', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Add manual as paused' }))
    expect(screen.getByTestId('active-count')).toHaveTextContent('1')
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-customer-${timerId}`)).toHaveTextContent('Manual Co')
    expect(screen.getByTestId(`timer-status-${timerId}`)).toHaveTextContent('paused')
    expect(screen.getByTestId(`timer-elapsed-${timerId}`)).toHaveTextContent('1800') // 30 min = 1800 sec
    expect(mockInvalidateTotals).toHaveBeenCalled()
  })
})
