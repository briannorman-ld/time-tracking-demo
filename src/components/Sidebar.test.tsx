import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { Sidebar } from './Sidebar'

vi.mock('launchdarkly-react-client-sdk', () => ({
  useFlags: vi.fn(),
}))

function renderSidebar(showThemeToggle = true) {
  vi.mocked(useFlags).mockReturnValue({ showThemeToggle } as ReturnType<typeof useFlags>)
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Sidebar />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: true } as ReturnType<typeof useFlags>)
  })

  it('shows theme toggle when showThemeToggle flag is true', () => {
    renderSidebar(true)
    expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeInTheDocument()
  })

  it('hides theme toggle when showThemeToggle flag is false', () => {
    renderSidebar(false)
    expect(screen.queryByRole('button', { name: /switch to (light|dark) mode/i })).not.toBeInTheDocument()
  })
})
