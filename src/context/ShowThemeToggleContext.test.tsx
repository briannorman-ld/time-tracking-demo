import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShowThemeToggleProvider, useShowThemeToggle } from '@/context/ShowThemeToggleContext'

const mockVariation = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()

vi.mock('launchdarkly-react-client-sdk', () => ({
  useLDClient: vi.fn(),
}))

async function getUseLDClient() {
  const { useLDClient } = await import('launchdarkly-react-client-sdk')
  return useLDClient as ReturnType<typeof vi.fn>
}

function TestConsumer() {
  const show = useShowThemeToggle()
  return <span data-testid="show-theme-toggle">{String(show)}</span>
}

describe('ShowThemeToggleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVariation.mockReturnValue(true)
    mockOn.mockReturnValue(undefined)
    mockOff.mockReturnValue(undefined)
  })

  it('evaluates flag once on mount and provides value', async () => {
    const useLDClient = await getUseLDClient()
    vi.mocked(useLDClient).mockReturnValue({
      variation: mockVariation,
      on: mockOn,
      off: mockOff,
    })

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(mockVariation).toHaveBeenCalledTimes(1)
    expect(mockVariation).toHaveBeenCalledWith('show-theme-toggle', true)
    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('true')
    expect(mockOn).toHaveBeenCalledWith('change:show-theme-toggle', expect.any(Function))
  })

  it('subscribes to flag change and uses default when client is not ready', async () => {
    const useLDClient = await getUseLDClient()
    vi.mocked(useLDClient).mockReturnValue(undefined)

    render(
      <ShowThemeToggleProvider>
        <TestConsumer />
      </ShowThemeToggleProvider>
    )

    expect(mockVariation).not.toHaveBeenCalled()
    expect(screen.getByTestId('show-theme-toggle')).toHaveTextContent('true')
  })
})
