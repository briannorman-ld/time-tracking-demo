import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DemoUser } from '@/types/user'
import { userToContext } from '@/types/user'
import { getDemoUserById } from '@/lib/userStore'
import { identifyUser } from '@/lib/integration'
import { trackEvent } from '@/utils/trackEvent'

const SESSION_KEY = 'time-tracker-demo-session'

interface SessionContextValue {
  user: DemoUser | null
  setUser: (user: DemoUser | null) => void
  login: (userId: string) => void
  logout: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

function loadSession(): DemoUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const id = JSON.parse(raw) as string
    return getDemoUserById(id) ?? null
  } catch {
    return null
  }
}

function saveSession(user: DemoUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user.id))
  else localStorage.removeItem(SESSION_KEY)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<DemoUser | null>(() => {
    const u = loadSession()
    if (u) {
      const ctx = userToContext(u)
      identifyUser(ctx)
    }
    return u
  })

  const setUser = useCallback((next: DemoUser | null) => {
    setUserState((prev) => {
      if (prev?.id === next?.id) return prev
      saveSession(next)
      if (next) {
        const ctx = userToContext(next)
        identifyUser(ctx)
        trackEvent('user_switched', { userId: next.id })
      }
      return next
    })
  }, [])

  const login = useCallback(
    (userId: string) => {
      const u = getDemoUserById(userId)
      if (u) setUser(u)
    },
    [setUser]
  )

  const logout = useCallback(() => setUser(null), [setUser])

  const value = useMemo(
    () => ({ user, setUser, login, logout }),
    [user, setUser, login, logout]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
