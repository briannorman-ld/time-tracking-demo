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
import { trackLaunchDarklyEvent, LD_EVENT_TIMER_STARTED } from '@/lib/launchDarklyEvents'
import { createEntry } from '@/lib/entries'
import { useTimeTotalsInvalidate } from '@/context/TimeTotalsInvalidatorContext'

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface ActiveTimer {
  id: string
  /** ID of the time entry created when this timer was started; updated on pause. */
  entryId?: string
  customer: string
  project: string
  notes: string
  startTime: number
  elapsedSec: number
  status: 'running' | 'paused'
}

interface TimerContextValue {
  /** Draft for the Start form (customer, notes before starting). */
  draftCustomer: string
  draftNotes: string
  setDraftCustomer: (v: string) => void
  setDraftNotes: (v: string) => void
  /** Start a new timer from draft; creates a time entry and clears draft. */
  start: () => void
  /** Start a new timer with the given details (e.g. from a saved entry). Creates entry and timer. */
  startWith: (customer: string, notes: string) => void
  /** All active timers (running or paused). */
  activeTimers: ActiveTimer[]
  /** Pause a timer; updates the entry's duration (entry was created on start). */
  pause: (id: string) => void
  /** Resume a paused timer. Does not create an entry. */
  resume: (id: string) => void
  /** Update customer/project/notes/entryId for an active timer. */
  updateTimer: (id: string, updates: { customer?: string; project?: string; notes?: string; entryId?: string }) => void
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
    entryId: t.entryId,
  }
}

function fromPersisted(p: PersistedActiveTimer): ActiveTimer {
  return {
    id: p.id,
    entryId: p.entryId,
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
  const invalidateTotals = useTimeTotalsInvalidate()
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([])
  const [draftCustomer, setDraftCustomer] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loadedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      setActiveTimers([])
      setDraftCustomer('')
      setDraftProject('')
      setDraftNotes('')
      loadedUserIdRef.current = null
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
      // Keep running timer: total elapsed = time since original start; leave startTime so display is correct.
      const totalElapsedSec = Math.floor((Date.now() - running.startTime) / 1000)
      timers = timers.map((t) =>
        t.id === running.id ? { ...t, elapsedSec: totalElapsedSec } : t
      )
    }
    // Only apply loaded state on initial load or when user changed; don't overwrite after resume/pause/start.
    if (loadedUserIdRef.current !== user.id) {
      loadedUserIdRef.current = user.id
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
    if (!draftCustomer.trim() || !user) return
    const now = Date.now()
    const today = new Date().toISOString().slice(0, 10)
    const customer = draftCustomer.trim()
    const notes = draftNotes.trim()
    createEntry(user.id, {
      customer,
      notes,
      date: today,
      durationMinutes: 0,
      source: 'timer',
    }).then((entry) => {
      const newTimer: ActiveTimer = {
        id: uuidv4(),
        entryId: entry.id,
        customer,
        project: '',
        notes,
        startTime: now,
        elapsedSec: 0,
        status: 'running',
      }
      setActiveTimers((prev) => [
        ...prev.map((t) => (t.status === 'running' ? { ...t, status: 'paused' as const } : t)),
        newTimer,
      ])
      setDraftCustomer('')
      setDraftNotes('')
      trackLaunchDarklyEvent(LD_EVENT_TIMER_STARTED, {
        timerId: newTimer.id,
        entryId: entry.id,
        userId: user.id,
        customer: newTimer.customer,
      })
      invalidateTotals?.()
    })
  }, [draftCustomer, draftNotes, user, invalidateTotals])

  const startWith = useCallback(
    (customer: string, notes: string) => {
      if (!customer.trim() || !user) return
      const now = Date.now()
      const today = new Date().toISOString().slice(0, 10)
      const c = customer.trim()
      const n = notes.trim()
      createEntry(user.id, {
        customer: c,
        notes: n,
        date: today,
        durationMinutes: 0,
        source: 'timer',
      }).then((entry) => {
        const newTimer: ActiveTimer = {
          id: uuidv4(),
          entryId: entry.id,
          customer: c,
          project: '',
          notes: n,
          startTime: now,
          elapsedSec: 0,
          status: 'running',
        }
        setActiveTimers((prev) => [
          ...prev.map((t) => (t.status === 'running' ? { ...t, status: 'paused' as const } : t)),
          newTimer,
        ])
        trackLaunchDarklyEvent(LD_EVENT_TIMER_STARTED, {
          timerId: newTimer.id,
          entryId: entry.id,
          userId: user.id,
          customer: newTimer.customer,
        })
        invalidateTotals?.()
      })
    },
    [user, invalidateTotals]
  )

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
    // Only updates timer state to running. Does NOT create a time entry or trigger LD events.
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

  const updateTimer = useCallback((id: string, updates: { customer?: string; project?: string; notes?: string; entryId?: string }) => {
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
    draftNotes,
    setDraftCustomer,
    setDraftNotes,
    start,
    startWith,
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
