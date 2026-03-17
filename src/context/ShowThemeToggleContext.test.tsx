import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShowThemeToggleProvider, useShowThemeToggle } from '@/context/ShowThemeToggleContext'

vi.mock('launchdarkly-react-client-sdk', () => ({
  useFlags: vi.fn(),
  useLDClient: vi.fn(() => null),
}))

vi.mock('@/context/SessionContext', () => ({
  useSession: vi.fn(() => ({ user: { id: 'test-user' } })),
}))

async function getUseFlags() {
  const { useFlags } = await import('launchdarkly-react-client-sdk')
  return useFlags as ReturnType<typeof vi.fn>
}

function TestConsumer() {
  const show = useShowThemeToggle()
  return <span data-testid="show-theme-toggle">{String(show)}</span>
}

describe('ShowThemeToggleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads showThemeToggle from useFlags and provides value', async () => {
    const useFlags = await getUseFlags()
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: true })

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('true')
  })

  it('returns false when flag is false', async () => {
    const useFlags = await getUseFlags()
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: false })

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('false')
  })

  it('uses default (true) when flags are empty or flag missing', async () => {
    const useFlags = await getUseFlags()
    vi.mocked(useFlags).mockReturnValue({})

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('true')
  })

  it('supports kebab-case key show-theme-toggle', async () => {
    const useFlags = await getUseFlags()
    vi.mocked(useFlags).mockReturnValue({ 'show-theme-toggle': false })

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('false')
  })

  it('hides toggle immediately on user switch, then shows new user flag after delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { useFlags } = await import('launchdarkly-react-client-sdk')
    const { useSession } = await import('@/context/SessionContext')
    const { useLDClient } = await import('launchdarkly-react-client-sdk')
    vi.mocked(useFlags).mockReturnValue({ showThemeToggle: true })
    const sessionMock = vi.mocked(useSession)
    sessionMock
      .mockReturnValueOnce({ user: { id: 'brian' } } as never)
      .mockReturnValue({ user: { id: 'alex' } } as never)
    const variation = vi.fn((_key: string, def: boolean) => def)
    variation.mockReturnValue(false)
    vi.mocked(useLDClient).mockReturnValue({ variation } as never)

    const { rerender } = render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )
    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('true')

    rerender(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )
    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('false')

    await vi.advanceTimersByTimeAsync(800)
    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('false')
    vi.useRealTimers()
  })
})
