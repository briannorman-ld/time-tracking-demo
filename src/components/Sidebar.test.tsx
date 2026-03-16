import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { useShowThemeToggle } from '@/context/ShowThemeToggleContext'
import { Sidebar } from './Sidebar'

vi.mock('@/context/ShowThemeToggleContext', () => ({
  useShowThemeToggle: vi.fn(),
}))

function renderSidebar(showThemeToggle = true) {
  vi.mocked(useShowThemeToggle).mockReturnValue(showThemeToggle)
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
    vi.mocked(useShowThemeToggle).mockReturnValue(true)
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
