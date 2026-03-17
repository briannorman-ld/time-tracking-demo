import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LDAdminToolsPanel } from './LDAdminToolsPanel'

const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
  planTier: 'free' as const,
}

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ user: mockUser }),
}))

describe('LDAdminToolsPanel', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    onClose.mockClear()
  })

  it('renders panel with title and close button', () => {
    render(<LDAdminToolsPanel onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: /launchdarkly admin tools/i })).toBeInTheDocument()
    expect(screen.getByText('LD Admin Tools')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('shows current context section with user context', () => {
    render(<LDAdminToolsPanel onClose={onClose} />)
    expect(screen.getByText('Current context')).toBeInTheDocument()
    expect(screen.getByText(/user \+ device context/i)).toBeInTheDocument()
    expect(screen.getByText(/"key": "user-1"/)).toBeInTheDocument()
  })

  it('shows event log section', () => {
    render(<LDAdminToolsPanel onClose={onClose} />)
    expect(screen.getByText('Event log')).toBeInTheDocument()
    expect(screen.getByText(/recent.*track.*events/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<LDAdminToolsPanel onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
