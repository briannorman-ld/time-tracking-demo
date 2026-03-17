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

  it('shows theme options (Light, Dark, Psychedelic) when showThemeToggle flag is true', () => {
    renderSidebar(true)
    expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /psychedelic mode/i })).toBeInTheDocument()
  })

  it('hides theme options when showThemeToggle flag is false', () => {
    renderSidebar(false)
    expect(screen.queryByRole('button', { name: /light mode/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dark mode/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /psychedelic mode/i })).not.toBeInTheDocument()
  })
})
