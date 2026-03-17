import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSession } from '@/context/SessionContext'

const SESSION_STORAGE_KEY = 'time-tracker-demo-ld-user-key-override'

function getStoredOverride(): string | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY)
}

interface LdUserKeyOverrideContextValue {
  userKeyOverride: string | null
  setUserKeyOverride: (key: string | null) => void
}

const LdUserKeyOverrideContext = createContext<LdUserKeyOverrideContextValue | null>(null)

export function LdUserKeyOverrideProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const [userKeyOverride, setUserKeyOverrideState] = useState<string | null>(getStoredOverride)
  const previousUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const currentId = user?.id
    if (previousUserIdRef.current !== undefined && previousUserIdRef.current !== currentId) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
      setUserKeyOverrideState(null)
    }
    previousUserIdRef.current = currentId
  }, [user?.id])

  const setOverride = useCallback((key: string | null) => {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    if (key !== null) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, key)
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
    window.location.reload()
  }, [])

  return (
    <LdUserKeyOverrideContext.Provider value={{ userKeyOverride, setUserKeyOverride: setOverride }}>
      {children}
    </LdUserKeyOverrideContext.Provider>
  )
}

export function useLdUserKeyOverride(): LdUserKeyOverrideContextValue | null {
  return useContext(LdUserKeyOverrideContext)
}
