/**
 * Single evaluation of the show-theme-toggle flag. The flag is read once on mount
 * and when LD notifies of a change, so we avoid re-evaluating on every render.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useLDClient } from 'launchdarkly-react-client-sdk'

const FLAG_KEY = 'show-theme-toggle'
const DEFAULT = true

const ShowThemeToggleContext = createContext<boolean>(DEFAULT)

export function ShowThemeToggleProvider({ children }: { children: ReactNode }) {
  const ldClient = useLDClient()
  const [showThemeToggle, setShowThemeToggle] = useState<boolean>(DEFAULT)

  useEffect(() => {
    if (!ldClient) return
    const initial = ldClient.variation(FLAG_KEY, DEFAULT) as boolean
    console.log('[LaunchDarkly] show-theme-toggle evaluated:', initial)
    setShowThemeToggle(initial)
    const handler = () => {
      const value = ldClient.variation(FLAG_KEY, DEFAULT) as boolean
      console.log('[LaunchDarkly] show-theme-toggle evaluated (change):', value)
      setShowThemeToggle(value)
    }
    ldClient.on(`change:${FLAG_KEY}`, handler)
    return () => {
      ldClient.off(`change:${FLAG_KEY}`, handler)
    }
  }, [ldClient])

  return (
    <ShowThemeToggleContext.Provider value={showThemeToggle}>
      {children}
    </ShowThemeToggleContext.Provider>
  )
}

export function useShowThemeToggle(): boolean {
  return useContext(ShowThemeToggleContext)
}
