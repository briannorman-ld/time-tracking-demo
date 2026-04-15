import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { formatDateLocal } from '@/utils/dateFormat'

export interface DashboardFocusDateContextValue {
  /** YYYY-MM-DD for the dashboard day picker (day view) or week anchor (week view). */
  focusDate: string
  setFocusDate: (date: string) => void
}

const DashboardFocusDateContext = createContext<DashboardFocusDateContextValue | null>(null)

export function DashboardFocusDateProvider({ children }: { children: ReactNode }) {
  const [focusDate, setFocusDateState] = useState(() => formatDateLocal(new Date()))
  const setFocusDate = useCallback((date: string) => {
    setFocusDateState(date)
  }, [])
  const value = useMemo(
    () => ({ focusDate, setFocusDate }),
    [focusDate, setFocusDate]
  )
  return (
    <DashboardFocusDateContext.Provider value={value}>
      {children}
    </DashboardFocusDateContext.Provider>
  )
}

export function useDashboardFocusDate(): DashboardFocusDateContextValue {
  const ctx = useContext(DashboardFocusDateContext)
  if (ctx == null) {
    throw new Error('useDashboardFocusDate must be used within DashboardFocusDateProvider')
  }
  return ctx
}
