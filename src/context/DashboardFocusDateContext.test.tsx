import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DashboardFocusDateProvider,
  useDashboardFocusDate,
} from '@/context/DashboardFocusDateContext'

function Consumer() {
  const { focusDate, setFocusDate } = useDashboardFocusDate()
  return (
    <div>
      <span data-testid="focus">{focusDate}</span>
      <button type="button" onClick={() => setFocusDate('2026-05-01')}>
        Set date
      </button>
    </div>
  )
}

describe('DashboardFocusDateContext', () => {
  it('exposes YYYY-MM-DD and updates when setFocusDate is called', async () => {
    const user = userEvent.setup()
    render(
      <DashboardFocusDateProvider>
        <Consumer />
      </DashboardFocusDateProvider>
    )
    expect(screen.getByTestId('focus').textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await user.click(screen.getByRole('button', { name: /set date/i }))
    expect(screen.getByTestId('focus')).toHaveTextContent('2026-05-01')
  })
})
