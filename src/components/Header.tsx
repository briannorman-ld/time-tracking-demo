import { useState } from 'react'
import { useSession } from '@/context/SessionContext'
import { useTimer } from '@/context/TimerContext'
import { useTimeTotalsInvalidate } from '@/context/TimeTotalsInvalidatorContext'
import { DEMO_USERS } from '@/seed/seedUsers'
import { roundToNearest } from '@/lib/preferences'
import { getRoundingPreference } from '@/lib/preferences'
import { createEntry } from '@/lib/entries'
import './Header.css'

export function Header() {
  const { user, setUser, logout } = useSession()
  const timer = useTimer()
  const invalidateTotals = useTimeTotalsInvalidate()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const runningTimer = timer.activeTimers.find((t) => t.status === 'running')

  const handlePause = (timerId: string) => {
    if (!user) return
    const t = timer.activeTimers.find((x) => x.id === timerId)
    if (!t) return
    const elapsedSec = timer.getElapsedSec(timerId)
    const rounded = roundToNearest(elapsedSec / 60, getRoundingPreference())
    if (rounded > 0) {
      createEntry(user.id, {
        customer: t.customer,
        project: t.project || undefined,
        notes: t.notes,
        date: today,
        durationMinutes: rounded,
        source: 'timer',
      }).finally(() => invalidateTotals?.())
    }
    timer.pause(timerId)
  }

  if (!user) return null

  const showTimerBar = !!runningTimer
  const pad = (n: number) => String(n).padStart(2, '0')
  const elapsedSec = runningTimer ? timer.getElapsedSec(runningTimer.id) : 0
  const h = Math.floor(elapsedSec / 3600)
  const m = Math.floor((elapsedSec % 3600) / 60)
  const s = elapsedSec % 60

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-header-title">Time Tracker Demo</span>
        {showTimerBar && runningTimer ? (
            <div className="app-header-timer-bar">
              <span className="app-header-timer-info">
                {runningTimer.customer || '—'}
                {runningTimer.project ? ` · ${runningTimer.project}` : ''}
              </span>
              <span className="app-header-timer-display">
                {pad(h)}:{pad(m)}:{pad(s)}
              </span>
              <button type="button" className="app-header-timer-pause" onClick={() => handlePause(runningTimer.id)}>
                Pause
              </button>
            </div>
          ) : null}
          <div className="app-header-actions">
            <div className="app-header-user">
              <button
                type="button"
                className="app-header-user-trigger"
                onClick={() => setSwitcherOpen((o) => !o)}
                aria-expanded={switcherOpen}
              >
                {user.displayName}
              </button>
              {switcherOpen && (
                <>
                  <div
                    className="app-header-user-backdrop"
                    onClick={() => setSwitcherOpen(false)}
                    aria-hidden
                  />
                  <div className="app-header-user-dropdown">
                    {DEMO_USERS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className={u.id === user.id ? 'app-header-user-option active' : 'app-header-user-option'}
                        onClick={() => {
                          setUser(u)
                          setSwitcherOpen(false)
                        }}
                      >
                        {u.displayName}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="app-header-user-option logout"
                      onClick={() => {
                        logout()
                        setSwitcherOpen(false)
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
  )
}
