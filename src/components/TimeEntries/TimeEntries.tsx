import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/context/SessionContext'
import {
  getEntriesByUserAndDate,
  getEntriesByUserInRange,
  createEntry,
  updateEntry,
  deleteEntry,
} from '@/lib/entries'
import { getCustomerNames, createCustomer } from '@/lib/customers'
import {
  getRoundingPreference,
  roundToNearest,
} from '@/lib/preferences'
import type { TimeEntry } from '@/types/entry'
import { evaluateFlag } from '@/lib/flags'
import { useTimeTotalsInvalidate } from '@/context/TimeTotalsInvalidatorContext'
import { useTimer } from '@/context/TimerContext'
import { trackEvent } from '@/utils/trackEvent'
import { formatDuration, minutesToDecimal, decimalToMinutes } from '@/utils/duration'
import { formatDisplayDate } from '@/utils/dateFormat'
import { NotesContent } from '@/components/NotesContent'
import { Timer } from './Timer'
import { EntryForm } from './EntryForm'
import './TimeEntries.css'

function formatDateForInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as local date (avoids UTC midnight timezone bugs). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d)
  start.setDate(diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  }
}

function getWeekDays(dateStr: string): string[] {
  const { start } = getWeekRange(parseLocalDate(dateStr))
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = parseLocalDate(start)
    d.setDate(d.getDate() + i)
    days.push(formatDateForInput(d))
  }
  return days
}

export function TimeEntries() {
  const { user } = useSession()
  const [view, setView] = useState<'day' | 'week'>('day')
  const [focusDate, setFocusDate] = useState(() => formatDateForInput(new Date()))
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [customers, setCustomers] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddTime, setShowAddTime] = useState(false)
  const [inlineEditEntryId, setInlineEditEntryId] = useState<string | null>(null)
  const [inlineEditHours, setInlineEditHours] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const navLayoutVariant = evaluateFlag('navLayoutVariant', 'tabs', {
    userId: user?.id,
  }) as 'tabs' | 'sidebar'
  const enableTimer = evaluateFlag('enableTimer', true, { userId: user?.id })
  const enableReports = evaluateFlag('enableReports', true, { userId: user?.id })
  const invalidateTotals = useTimeTotalsInvalidate()
  const timer = useTimer()

  const loadEntries = useCallback(async () => {
    if (!user) return
    if (view === 'day') {
      const list = await getEntriesByUserAndDate(user.id, focusDate)
      setEntries(list)
    } else {
      const { start, end } = getWeekRange(parseLocalDate(focusDate))
      const list = await getEntriesByUserInRange(user.id, start, end)
      setEntries(list)
    }
    invalidateTotals?.()
  }, [user, view, focusDate, invalidateTotals])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  useEffect(() => {
    if (!user) return
    getCustomerNames(user.id).then(setCustomers)
  }, [user])

  const handleViewChange = (v: 'day' | 'week') => {
    setView(v)
    trackEvent('view_changed', { view: v })
  }

  const handleCreated = () => {
    loadEntries()
  }

  const handleCreateCustomer = useCallback(
    async (name: string) => {
      if (!user) return ''
      const customer = await createCustomer(user.id, name)
      const list = await getCustomerNames(user.id)
      setCustomers(list)
      return customer.name
    },
    [user]
  )

  const handlePauseTimer = useCallback(
    (timerId: string) => {
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
          date: focusDate,
          durationMinutes: rounded,
          source: 'timer',
        }).then(handleCreated)
      }
      timer.pause(timerId)
    },
    [user, focusDate, timer]
  )

  const handleUpdate = async (
    entryId: string,
    updates: Partial<Pick<TimeEntry, 'customer' | 'project' | 'notes' | 'date' | 'durationMinutes' | 'billable' | 'hourlyRate'>>
  ) => {
    if (!user) return
    const updated = await updateEntry(entryId, user.id, updates)
    if (updated) {
      setEditingId(null)
      loadEntries()
    }
  }

  const handleInlineDurationSave = (entryId: string) => {
    const hours = parseFloat(inlineEditHours)
    if (!user || Number.isNaN(hours) || hours < 0) {
      setInlineEditEntryId(null)
      return
    }
    const minutes = decimalToMinutes(hours)
    updateEntry(entryId, user.id, { durationMinutes: minutes }).then(() => {
      loadEntries()
      setInlineEditEntryId(null)
    })
  }

  const handleDelete = async (entryId: string) => {
    if (!user) return
    await deleteEntry(entryId, user.id)
    setEditingId(null)
    loadEntries()
  }

  if (!user) return null

  const dayPrev = () => {
    const d = parseLocalDate(focusDate)
    d.setDate(d.getDate() - (view === 'day' ? 1 : 7))
    setFocusDate(formatDateForInput(d))
  }
  const dayNext = () => {
    const d = parseLocalDate(focusDate)
    d.setDate(d.getDate() + (view === 'day' ? 1 : 7))
    setFocusDate(formatDateForInput(d))
  }
  const goToToday = () => {
    setFocusDate(formatDateForInput(new Date()))
  }

  return (
    <div className="time-entries">
      <div className="time-entries-toolbar">
        <div className="time-entries-nav">
          <button type="button" onClick={dayPrev} aria-label="Previous">
            ‹
          </button>
          <input
            type="date"
            value={focusDate}
            onChange={(e) => setFocusDate(e.target.value)}
          />
          <button type="button" onClick={dayNext} aria-label="Next">
            ›
          </button>
          <button
            type="button"
            className="time-entries-nav-today"
            onClick={goToToday}
            aria-label="Go to today"
          >
            Today
          </button>
        </div>
        <div
          className={
            navLayoutVariant === 'sidebar'
              ? 'time-entries-view-tabs sidebar-style'
              : 'time-entries-view-tabs'
          }
        >
          <button
            type="button"
            className={view === 'day' ? 'active' : ''}
            onClick={() => handleViewChange('day')}
          >
            Day
          </button>
          <button
            type="button"
            className={view === 'week' ? 'active' : ''}
            onClick={() => handleViewChange('week')}
          >
            Week
          </button>
        </div>
        <button
          type="button"
          className="time-entries-add-btn"
          onClick={() => setShowAddTime(true)}
        >
          Add time
        </button>
      </div>

      <div className="time-entries-main">
        <div className="time-entries-primary">
          {enableTimer && (
            <Timer customerNames={customers} onCreateCustomer={handleCreateCustomer} />
          )}
          {showAddTime ? (
            <div className="time-entries-add-time-card">
              <EntryForm
                focusDate={focusDate}
                customerNames={customers}
                onCreateCustomer={handleCreateCustomer}
                onCreated={() => {
                  handleCreated()
                  setShowAddTime(false)
                }}
                uxVariant="form"
                rounding={getRoundingPreference()}
                onCancel={() => setShowAddTime(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              className="time-entries-add-inline"
              onClick={() => setShowAddTime(true)}
            >
              + Add time
            </button>
          )}
          <section className="time-entries-list">
            <h3>
              {view === 'day' ? formatDisplayDate(focusDate) : `Week of ${formatDisplayDate(focusDate)}`} — Entries
            </h3>
            {view === 'week' && (
              <div className="time-entries-week-grid-wrapper">
                <table className="time-entries-week-grid">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      {getWeekDays(focusDate).map((d) => (
                        <th key={d}>{formatDisplayDate(d)}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set(entries.map((e) => e.customer))
                    ).sort().map((customerName) => {
                      const byDay = getWeekDays(focusDate).reduce<Record<string, number>>((acc, d) => {
                        acc[d] = entries
                          .filter((e) => e.customer === customerName && e.date === d)
                          .reduce((s, e) => s + e.durationMinutes, 0)
                        return acc
                      }, {})
                      const total = Object.values(byDay).reduce((a, b) => a + b, 0)
                      return (
                        <tr key={customerName}>
                          <td>{customerName}</td>
                          {getWeekDays(focusDate).map((d) => (
                            <td key={d}>
                              {byDay[d] ? formatDuration(byDay[d]) : '—'}
                            </td>
                          ))}
                          <td className="time-entries-week-total">{formatDuration(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {timer.activeTimers.length > 0 && (
              <ul className="time-entries-active-timers">
                {timer.activeTimers.map((t) => {
                  const sec = timer.getElapsedSec(t.id)
                  const pad = (n: number) => String(n).padStart(2, '0')
                  const h = Math.floor(sec / 3600)
                  const m = Math.floor((sec % 3600) / 60)
                  const s = sec % 60
                  const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`
                  return (
                    <li key={t.id} className="entry entry-active-timer">
                      <span className="entry-badge">Timer</span>
                      <span className="entry-customer">{t.customer}</span>
                      {t.project && <span className="entry-project">{t.project}</span>}
                      <span className="entry-duration entry-timer-live">{durationStr}</span>
                      {t.notes && (
                        <span className="entry-notes">
                          <NotesContent html={t.notes} />
                        </span>
                      )}
                      <span className="entry-actions">
                        {t.status === 'running' && (
                          <button type="button" className="entry-btn-pause" onClick={() => handlePauseTimer(t.id)}>
                            Pause
                          </button>
                        )}
                        {t.status === 'paused' && (
                          <button type="button" className="entry-btn-resume" onClick={() => timer.resume(t.id)}>
                            Resume
                          </button>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <ul>
              {entries.map((e) => (
                <li key={e.id}>
                  {editingId === e.id ? (
                    <EntryForm
                      focusDate={e.date}
                      customerNames={customers}
                      onCreateCustomer={handleCreateCustomer}
                      initialCustomer={e.customer}
                      initialProject={e.project}
                      initialNotes={e.notes}
                      initialDuration={e.durationMinutes}
                      initialBillable={e.billable}
                      entryId={e.id}
                      onSave={(updates) => handleUpdate(e.id, updates)}
                      onCancel={() => setEditingId(null)}
                      rounding={getRoundingPreference()}
                    />
                  ) : (
                    <>
                      <span className="entry-customer">{e.customer}</span>
                      {e.project && <span className="entry-project">{e.project}</span>}
                      {inlineEditEntryId === e.id ? (
                        <span className="entry-duration-inline">
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            value={inlineEditHours}
                            onChange={(ev) => setInlineEditHours(ev.target.value)}
                            onBlur={() => handleInlineDurationSave(e.id)}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter') handleInlineDurationSave(e.id)
                              if (ev.key === 'Escape') setInlineEditEntryId(null)
                            }}
                            autoFocus
                            className="entry-duration-input"
                          />
                          hrs
                        </span>
                      ) : (
                        <span
                          className="entry-duration entry-duration-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setInlineEditEntryId(e.id)
                            setInlineEditHours(minutesToDecimal(e.durationMinutes).toString())
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault()
                              setInlineEditEntryId(e.id)
                              setInlineEditHours(minutesToDecimal(e.durationMinutes).toString())
                            }
                          }}
                        >
                          {formatDuration(e.durationMinutes)}
                        </span>
                      )}
                      {e.notes && (
                        <span className="entry-notes">
                          <NotesContent html={e.notes} />
                        </span>
                      )}
                      <span className="entry-source">{e.source}</span>
                      <div className="entry-menu-wrap">
                        <button
                          type="button"
                          className="entry-menu-trigger"
                          onClick={() => setOpenMenuId(openMenuId === e.id ? null : e.id)}
                          aria-label="Edit or delete entry"
                          aria-expanded={openMenuId === e.id}
                        >
                          <span aria-hidden>⋮</span>
                        </button>
                        {openMenuId === e.id && (
                          <>
                            <div
                              className="entry-menu-backdrop"
                              onClick={() => setOpenMenuId(null)}
                              aria-hidden
                            />
                            <div className="entry-menu-dropdown" role="menu">
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setEditingId(e.id)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="danger"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  handleDelete(e.id)
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
        {enableReports && (
          <aside className="time-entries-reports">
            <div className="reports-card">
              <h4>Reports</h4>
              <p>Total this {view}: {formatDuration(entries.reduce((s, e) => s + e.durationMinutes, 0))}</p>
              <p className="reports-note">Minimal placeholder. Add real reports later.</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
