import { createContext, useCallback, useContext, useState } from 'react'

interface TimeTotalsInvalidatorContextValue {
  version: number
  invalidate: () => void
}

const TimeTotalsInvalidatorContext = createContext<TimeTotalsInvalidatorContextValue | null>(null)

export function TimeTotalsInvalidatorProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0)
  const invalidate = useCallback(() => setVersion((v) => v + 1), [])
  return (
    <TimeTotalsInvalidatorContext.Provider value={{ version, invalidate }}>
      {children}
    </TimeTotalsInvalidatorContext.Provider>
  )
}

export function useTimeTotalsInvalidate(): (() => void) | undefined {
  const ctx = useContext(TimeTotalsInvalidatorContext)
  return ctx?.invalidate
}

export function useTimeTotalsInvalidatorVersion(): number {
  const ctx = useContext(TimeTotalsInvalidatorContext)
  return ctx?.version ?? 0
}
