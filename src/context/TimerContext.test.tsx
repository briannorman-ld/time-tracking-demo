import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimerProvider, useTimer } from '@/context/TimerContext'

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ user: { id: 'test-user' } }),
}))

const saveActiveTimers = vi.fn()
const clearTimerState = vi.fn()
const loadLegacyTimerState = vi.fn(() => null)
const clearLegacyTimerState = vi.fn()

vi.mock('@/utils/timerStorage', () => ({
  loadActiveTimers: () => [],
  saveActiveTimers,
  clearTimerState,
  loadLegacyTimerState,
  clearLegacyTimerState,
}))

function TestConsumer() {
  const {
    draftCustomer,
    draftProject,
    draftNotes,
    setDraftCustomer,
    setDraftProject,
    setDraftNotes,
    start,
    activeTimers,
    pause,
    resume,
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
        data-testid="draft-project"
        value={draftProject}
        onChange={(e) => setDraftProject(e.target.value)}
      />
      <input
        data-testid="draft-notes"
        value={draftNotes}
        onChange={(e) => setDraftNotes(e.target.value)}
      />
      <button type="button" onClick={start}>
        Start
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByTestId('active-count')).toHaveTextContent('1')
    expect(screen.getByTestId('draft-customer')).toHaveValue('')
    const timerId = screen.getByTestId('active-count').nextElementSibling?.getAttribute('data-testid')?.replace('timer-', '') ?? ''
    expect(screen.getByTestId(`timer-customer-${timerId}`)).toHaveTextContent('Acme')
    expect(screen.getByTestId(`timer-status-${timerId}`)).toHaveTextContent('running')
  })

  it('does not start when draft customer is empty', async () => {
    const user = userEvent.setup()
    render(
      <TimerProvider>
        <TestConsumer />
      </TimerProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Start' }))
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
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
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(saveActiveTimers).toHaveBeenCalled()
  })
})
