import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

vi.mock('launchdarkly-react-client-sdk', () => ({
  useFlags: vi.fn(),
}))

const THEME_KEY = 'time-tracker-demo-theme'

function TestConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button type="button" onClick={() => setTheme('light')}>
        Set light
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Set dark
      </button>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: true } as ReturnType<typeof useFlags>)
    localStorage.removeItem(THEME_KEY)
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.removeItem(THEME_KEY)
  })

  it('defaults to dark theme and applies data-theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('setTheme updates theme and data-theme', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Set light' }))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    await user.click(screen.getByRole('button', { name: 'Set dark' }))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('toggleTheme flips between light and dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    await user.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Set light' }))
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    await user.click(screen.getByRole('button', { name: 'Set dark' }))
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('restores theme from localStorage on mount', () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('forces light mode when showThemeToggle flag is off', () => {
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: false } as ReturnType<typeof useFlags>)
    localStorage.setItem(THEME_KEY, 'dark')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
