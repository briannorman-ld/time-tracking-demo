/**
 * Reads the show-theme-toggle flag. When the session user changes we force-hide
 * the toggle briefly, then re-read from the LD client (identify() is async and
 * useFlags() can lag; re-reading after a delay ensures we get the new user's value).
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLDClient, useFlags } from 'launchdarkly-react-client-sdk'
import { useSession } from '@/context/SessionContext'

const FLAG_KEY = 'show-theme-toggle'
const DEFAULT = true
const REREAD_DELAY_MS = 800

const ShowThemeToggleContext = createContext<boolean>(DEFAULT)

function readShowThemeToggle(flags: Record<string, unknown>): boolean {
  const v = flags.showThemeToggle ?? flags['show-theme-toggle']
  return typeof v === 'boolean' ? v : DEFAULT
}

export function ShowThemeToggleProvider({ children }: { children: ReactNode }) {
  const flags = useFlags()
  const ldClient = useLDClient()
  const { user } = useSession()
  const userId = user?.id
  const [forceHide, setForceHide] = useState(false)
  const [resolvedAfterSwitch, setResolvedAfterSwitch] = useState<boolean | null>(null)
  const prevUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId
      return
    }
    if (prevUserIdRef.current === userId) return
    prevUserIdRef.current = userId
    setForceHide(true)
    setResolvedAfterSwitch(null)
    const t = setTimeout(() => {
      const value =
        ldClient != null
          ? (ldClient.variation(FLAG_KEY, DEFAULT) as boolean)
          : readShowThemeToggle(flags)
      setResolvedAfterSwitch(value)
      setForceHide(false)
    }, REREAD_DELAY_MS)
    return () => clearTimeout(t)
  }, [userId, ldClient, flags])

  const fromFlags = readShowThemeToggle(flags)
  const showThemeToggle = forceHide ? false : (resolvedAfterSwitch ?? fromFlags)

  return (
    <ShowThemeToggleContext.Provider value={showThemeToggle}>
      {children}
    </ShowThemeToggleContext.Provider>
  )
}

export function useShowThemeToggle(): boolean {
  return useContext(ShowThemeToggleContext)
}
