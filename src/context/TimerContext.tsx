/**
 * Global timer state: multiple active timers, one running at a time.
 * When a timer is started it appears in the entries list; new timers can be started.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '@/context/SessionContext'
import {
  loadActiveTimers,
  saveActiveTimers,
  clearTimerState,
  loadLegacyTimerState,
  clearLegacyTimerState,
  type PersistedActiveTimer,
} from '@/utils/timerStorage'
import { v4 as uuidv4 } from 'uuid'

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface ActiveTimer {
  id: string
  customer: string
  project: string
  notes: string
  startTime: number
  elapsedSec: number
  status: 'running' | 'paused'
}

interface TimerContextValue {
  /** Draft for the Start form (customer, project, notes before starting). */
  draftCustomer: string
  draftProject: string
  draftNotes: string
  setDraftCustomer: (v: string) => void
  setDraftProject: (v: string) => void
  setDraftNotes: (v: string) => void
  /** Start a new timer from draft; clears draft. */
  start: () => void
  /** All active timers (running or paused). */
  activeTimers: ActiveTimer[]
  pause: (id: string) => void
  resume: (id: string) => void
  /** Update customer/project/notes for an active timer. */
  updateTimer: (id: string, updates: { customer?: string; project?: string; notes?: string }) => void
  /** Elapsed seconds for a given timer (live for running, static for paused). */
  getElapsedSec: (id: string) => number
}

const TimerContext = createContext<TimerContextValue | null>(null)

function toPersisted(t: ActiveTimer, userId: string): PersistedActiveTimer {
  return {
    id: t.id,
    userId,
    customer: t.customer,
    project: t.project || undefined,
    notes: t.notes,
    startTime: t.startTime,
    elapsedSec: t.elapsedSec,
    running: t.status === 'running',
  }
}

function fromPersisted(p: PersistedActiveTimer): ActiveTimer {
  return {
    id: p.id,
    customer: p.customer,
    project: p.project ?? '',
    notes: p.notes,
    startTime: p.startTime,
    elapsedSec: p.elapsedSec,
    status: p.running ? 'running' : 'paused',
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([])
  const [draftCustomer, setDraftCustomer] = useState('')
  const [draftProject, setDraftProject] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) {
      setActiveTimers([])
      setDraftCustomer('')
      setDraftProject('')
      setDraftNotes('')
      return
    }
    const persisted = loadActiveTimers(user.id)
    let timers = persisted.map(fromPersisted)
    if (!timers.length) {
      const legacy = loadLegacyTimerState(user.id)
      if (legacy) {
        timers = [fromPersisted(legacy)]
        saveActiveTimers(timers.map((t) => toPersisted(t, user.id)))
        clearLegacyTimerState()
      }
    }
    const running = timers.find((t) => t.status === 'running')
    if (running) {
      const elapsedSinceStart = Math.floor((Date.now() - running.startTime) / 1000)
      setActiveTimers(
        timers.map((t) =>
          t.id === running.id
            ? { ...t, elapsedSec: t.elapsedSec + elapsedSinceStart, startTime: Date.now() - (t.elapsedSec + elapsedSinceStart) * 1000 }
            : t
        )
      )
    } else {
      setActiveTimers(timers)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user || !activeTimers.length) {
      clearTimerState()
      return
    }
    const persisted = activeTimers.map((t) => toPersisted(t, user.id))
    saveActiveTimers(persisted)
  }, [user?.id, activeTimers])

  useEffect(() => {
    const running = activeTimers.find((t) => t.status === 'running')
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setActiveTimers((prev) => {
        const r = prev.find((t) => t.status === 'running')
        if (!r) return prev
        const elapsed = Math.floor((Date.now() - r.startTime) / 1000)
        return prev.map((t) => (t.status === 'running' ? { ...t, elapsedSec: elapsed } : t))
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTimers.find((t) => t.status === 'running')?.id])

  const start = useCallback(() => {
    if (!draftCustomer.trim()) return
    const now = Date.now()
    const newTimer: ActiveTimer = {
      id: uuidv4(),
      customer: draftCustomer.trim(),
      project: draftProject.trim(),
      notes: draftNotes.trim(),
      startTime: now,
      elapsedSec: 0,
      status: 'running',
    }
    setActiveTimers((prev) => [
      ...prev.map((t) => (t.status === 'running' ? { ...t, status: 'paused' as const } : t)),
      newTimer,
    ])
    setDraftCustomer('')
    setDraftProject('')
    setDraftNotes('')
  }, [draftCustomer, draftProject, draftNotes])

  const pause = useCallback((id: string) => {
    setActiveTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const elapsed = t.status === 'running' ? Math.floor((Date.now() - t.startTime) / 1000) : t.elapsedSec
        return { ...t, status: 'paused' as const, elapsedSec: elapsed }
      })
    )
  }, [])

  const resume = useCallback((id: string) => {
    const now = Date.now()
    setActiveTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, status: 'running' as const, startTime: now - t.elapsedSec * 1000 }
        }
        if (t.status === 'running') {
          const currentElapsed = Math.floor((now - t.startTime) / 1000)
          return { ...t, status: 'paused' as const, elapsedSec: currentElapsed }
        }
        return t
      })
    )
  }, [])

  const updateTimer = useCallback((id: string, updates: { customer?: string; project?: string; notes?: string }) => {
    setActiveTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const getElapsedSec = useCallback(
    (id: string): number => {
      const t = activeTimers.find((x) => x.id === id)
      if (!t) return 0
      if (t.status === 'running') {
        return Math.floor((Date.now() - t.startTime) / 1000)
      }
      return t.elapsedSec
    },
    [activeTimers]
  )

  const value: TimerContextValue = {
    draftCustomer,
    draftProject,
    draftNotes,
    setDraftCustomer,
    setDraftProject,
    setDraftNotes,
    start,
    activeTimers,
    pause,
    resume,
    updateTimer,
    getElapsedSec,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within TimerProvider')
  return ctx
}
