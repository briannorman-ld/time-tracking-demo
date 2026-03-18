import { useState, useEffect, useCallback } from 'react'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { useSession } from '@/context/SessionContext'
import {
  getEntriesByUserAndDate,
  getEntriesByUserInRange,
  getEntry,
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
import { useTimeTotalsInvalidate, useTimeTotalsInvalidatorVersion } from '@/context/TimeTotalsInvalidatorContext'
import { useTimer } from '@/context/TimerContext'
import { trackEvent } from '@/utils/trackEvent'
import { formatDuration } from '@/utils/duration'
import { formatDisplayDate, formatEntryRowDate } from '@/utils/dateFormat'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons'
import { NotesContent } from '@/components/NotesContent'
import { Timer } from './Timer'
import { EntryForm } from './EntryForm'
import { EntryEditModal } from './EntryEditModal'
import './TimeEntries.css'

function readTileLayoutFlag(flags: Record<string, unknown>): boolean {
  const v = flags.tileLayout ?? flags['tile-layout']
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v.toLowerCase() === 'true'
  return false
}

const NOTES_PREVIEW_MAX_LEN = 60

function stripHtmlForPreview(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** True only when notes would be truncated with an ellipsis in the collapsed preview. */
function isNotesLong(html: string): boolean {
  return stripHtmlForPreview(html || '').length > NOTES_PREVIEW_MAX_LEN
}

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
  const [showAddTime, setShowAddTime] = useState(false)
  const [entryModalId, setEntryModalId] = useState<string | null>(null)
  const [entryModalFetched, setEntryModalFetched] = useState<TimeEntry | null>(null)
  const [expandedNotesIds, setExpandedNotesIds] = useState<Set<string>>(new Set())

  const toggleNotesExpanded = useCallback((id: string) => {
    setExpandedNotesIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const invalidateTotals = useTimeTotalsInvalidate()
  const invalidatorVersion = useTimeTotalsInvalidatorVersion()
  const timer = useTimer()
  const flags = useFlags()
  const tileLayout = readTileLayoutFlag(flags)

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
  }, [user, view, focusDate, invalidateTotals, invalidatorVersion])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  useEffect(() => {
    if (!user) return
    getCustomerNames(user.id).then(setCustomers)
  }, [user])

  useEffect(() => {
    if (!entryModalId || !user) {
      setEntryModalFetched(null)
      return
    }
    getEntry(entryModalId, user.id).then((entry) => setEntryModalFetched(entry ?? null))
  }, [entryModalId, user?.id])

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
      if (t.entryId) {
        updateEntry(t.entryId, user.id, { durationMinutes: rounded }).then(handleCreated)
      } else if (rounded > 0) {
        createEntry(user.id, {
          customer: t.customer,
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
    updates: Partial<Pick<TimeEntry, 'customer' | 'notes' | 'date' | 'durationMinutes' | 'billable' | 'hourlyRate'>>
  ) => {
    if (!user) return
    const updated = await updateEntry(entryId, user.id, updates)
    if (updated) {
      await loadEntries()
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!user) return
    await deleteEntry(entryId, user.id)
    setEntryModalId(null)
    setEntryModalFetched(null)
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

  // In day view, only show active timers whose entry is for the focused date (or that have no entry yet).
  const activeTimersForFocusDate =
    view === 'day'
      ? timer.activeTimers.filter(
          (t) => !t.entryId || entries.some((e) => e.id === t.entryId)
        )
      : timer.activeTimers

  // Week range for the focused date (Monday–Sunday).
  const weekRange =
    view === 'week' ? getWeekRange(parseLocalDate(focusDate)) : null
  const weekDays = weekRange ? getWeekDays(focusDate) : []

  // Day view: only entries for focusDate. Week view: only entries in the displayed week.
  const entriesForDisplay =
    view === 'day'
      ? entries.filter((e) => e.date === focusDate)
      : view === 'week' && weekRange
        ? entries.filter(
            (e) => e.date >= weekRange.start && e.date <= weekRange.end
          )
        : entries

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
        <div className="time-entries-view-tabs">
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
      </div>

      <div className="time-entries-main">
        <div className="time-entries-primary">
          <Timer customerNames={customers} onCreateCustomer={handleCreateCustomer} />
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
              + Add manual entry
            </button>
          )}
          <section className="time-entries-list">
            <h3>
              {view === 'day' ? formatDisplayDate(focusDate) : `Week of ${formatDisplayDate(focusDate)}`}
            </h3>
            {view === 'week' && weekDays.length > 0 && (
              <div className="time-entries-week-grid-wrapper">
                <table className="time-entries-week-grid">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      {weekDays.map((d) => (
                        <th key={d}>{formatDisplayDate(d)}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set(entriesForDisplay.map((e) => e.customer))
                    ).sort().map((customerName) => {
                      const byDay = weekDays.reduce<Record<string, number>>((acc, d) => {
                        acc[d] = entriesForDisplay
                          .filter((e) => e.customer === customerName && e.date === d)
                          .reduce((s, e) => s + e.durationMinutes, 0)
                        return acc
                      }, {})
                      const total = Object.values(byDay).reduce((a, b) => a + b, 0)
                      return (
                        <tr key={customerName}>
                          <td>{customerName}</td>
                          {weekDays.map((d) => (
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
            {tileLayout ? (
              <div className="time-entries-tiles">
                <div className="time-entries-tiles-grid">
                  {activeTimersForFocusDate.map((t) => {
                    const sec = timer.getElapsedSec(t.id)
                    const pad = (n: number) => String(n).padStart(2, '0')
                    const h = Math.floor(sec / 3600)
                    const m = Math.floor((sec % 3600) / 60)
                    const s = sec % 60
                    const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`
                    const entry = t.entryId
                      ? (entries.find((e) => e.id === t.entryId) ?? (entryModalId === t.entryId ? entryModalFetched : null))
                      : null
                    const showEntryDuration = t.status === 'paused' && entry
                    const notesHtml = entry?.notes ?? t.notes ?? ''
                    const notesId = t.entryId ?? t.id
                    const long = isNotesLong(notesHtml)
                    const expanded = expandedNotesIds.has(notesId)
                    return (
                      <div
                        key={t.id}
                        className="entry-tile entry-tile-active"
                        onClick={() => t.entryId && setEntryModalId(t.entryId)}
                        role={t.entryId ? 'button' : undefined}
                        tabIndex={t.entryId ? 0 : undefined}
                        onKeyDown={
                          t.entryId
                            ? (ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  ev.preventDefault()
                                  setEntryModalId(t.entryId!)
                                }
                              }
                            : undefined
                        }
                      >
                        <div className="entry-tile-row">
                          <div className="entry-tile-actions" onClick={(ev) => ev.stopPropagation()}>
                            {t.status === 'running' ? (
                              <button type="button" className="entry-btn-pause" onClick={() => handlePauseTimer(t.id)} aria-label="Pause">⏸</button>
                            ) : (
                              <button type="button" className="entry-btn-resume" onClick={() => timer.resume(t.id)} title="Resume timer" aria-label="Resume">▶</button>
                            )}
                          </div>
                          <span className="entry-tile-customer">{t.customer}</span>
                          <span className={`entry-tile-duration ${showEntryDuration ? '' : 'entry-timer-live'}`}>
                            {showEntryDuration ? formatDuration(entry!.durationMinutes) : durationStr}
                          </span>
                        </div>
                        <div className="entry-tile-body">
                          {notesHtml && (
                            <>
                              {!long ? (
                                <span className="entry-tile-notes"><NotesContent html={notesHtml} /></span>
                              ) : (
                                <>
                                  <span className={expanded ? 'entry-tile-notes entry-notes-expanded' : 'entry-tile-notes entry-notes-collapsed'}>
                                    {expanded ? <NotesContent html={notesHtml} /> : (
                                      <span className="entry-notes-preview">
                                        {stripHtmlForPreview(notesHtml).slice(0, NOTES_PREVIEW_MAX_LEN)}
                                        {stripHtmlForPreview(notesHtml).length > NOTES_PREVIEW_MAX_LEN ? '…' : ''}
                                      </span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    className="entry-notes-toggle"
                                    onClick={(ev) => { ev.stopPropagation(); toggleNotesExpanded(notesId) }}
                                    aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
                                  >
                                    <FontAwesomeIcon icon={expanded ? faAngleUp : faAngleDown} />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        {entry && (
                          <div className="entry-tile-date-wrap">
                            <span className="entry-tile-date">{formatEntryRowDate(entry.date)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {entriesForDisplay
                    .filter((e) => !activeTimersForFocusDate.some((t) => t.entryId === e.id))
                    .map((e) => {
                      const pausedMatch = activeTimersForFocusDate.find(
                        (t) =>
                          t.status === 'paused' &&
                          !t.entryId &&
                          t.customer === e.customer &&
                          (t.notes ?? '') === (e.notes ?? '')
                      )
                      const canResume = !!pausedMatch
                      const notesHtml = e.notes ?? ''
                      const long = isNotesLong(notesHtml)
                      const expanded = expandedNotesIds.has(e.id)
                      return (
                        <div
                          key={e.id}
                          className="entry-tile"
                          onClick={() => setEntryModalId(e.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault()
                              setEntryModalId(e.id)
                            }
                          }}
                        >
                          <div className="entry-tile-row">
                            <div className="entry-tile-actions" onClick={(ev) => ev.stopPropagation()}>
                              {canResume ? (
                                <button
                                  type="button"
                                  className="entry-btn-resume"
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    if (pausedMatch) {
                                      timer.updateTimer(pausedMatch.id, { entryId: e.id })
                                      timer.resume(pausedMatch.id)
                                    }
                                  }}
                                  title="Resume timer"
                                  aria-label="Resume timer"
                                >
                                  ▶
                                </button>
                              ) : (
                                <span className="entry-actions-placeholder" aria-hidden />
                              )}
                            </div>
                            <span className="entry-tile-customer">{e.customer}</span>
                            <span className="entry-tile-duration">{formatDuration(e.durationMinutes)}</span>
                          </div>
                          <div className="entry-tile-body">
                            {notesHtml && (
                              <>
                                {!long ? (
                                  <span className="entry-tile-notes"><NotesContent html={notesHtml} /></span>
                                ) : (
                                  <>
                                    <span className={expanded ? 'entry-tile-notes entry-notes-expanded' : 'entry-tile-notes entry-notes-collapsed'}>
                                      {expanded ? <NotesContent html={notesHtml} /> : (
                                        <span className="entry-notes-preview">
                                          {stripHtmlForPreview(notesHtml).slice(0, NOTES_PREVIEW_MAX_LEN)}
                                          {stripHtmlForPreview(notesHtml).length > NOTES_PREVIEW_MAX_LEN ? '…' : ''}
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      className="entry-notes-toggle"
                                      onClick={(ev) => { ev.stopPropagation(); toggleNotesExpanded(e.id) }}
                                      aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
                                    >
                                      <FontAwesomeIcon icon={expanded ? faAngleUp : faAngleDown} />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          <div className="entry-tile-date-wrap">
                            <span className="entry-tile-date">{formatEntryRowDate(e.date)}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ) : (
              <>
                {activeTimersForFocusDate.length > 0 && (
                  <ul className="time-entries-active-timers">
                    {activeTimersForFocusDate.map((t) => {
                      const sec = timer.getElapsedSec(t.id)
                      const pad = (n: number) => String(n).padStart(2, '0')
                      const h = Math.floor(sec / 3600)
                      const m = Math.floor((sec % 3600) / 60)
                      const s = sec % 60
                      const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`
                      const entry = t.entryId
                        ? (entries.find((e) => e.id === t.entryId) ?? (entryModalId === t.entryId ? entryModalFetched : null))
                        : null
                      const showEntryDuration = t.status === 'paused' && entry
                      return (
                        <li
                          key={t.id}
                          className="entry entry-active-timer entry-row-clickable"
                          onClick={() => t.entryId && setEntryModalId(t.entryId)}
                          role={t.entryId ? 'button' : undefined}
                          tabIndex={t.entryId ? 0 : undefined}
                          onKeyDown={
                            t.entryId
                              ? (ev) => {
                                  if (ev.key === 'Enter' || ev.key === ' ') {
                                    ev.preventDefault()
                                    setEntryModalId(t.entryId!)
                                  }
                                }
                              : undefined
                          }
                        >
                          <span className="entry-actions entry-actions-left" onClick={(ev) => ev.stopPropagation()}>
                            {t.status === 'running' ? (
                              <button type="button" className="entry-btn-pause" onClick={() => handlePauseTimer(t.id)} aria-label="Pause">⏸</button>
                            ) : (
                              <button type="button" className="entry-btn-resume" onClick={() => timer.resume(t.id)} title="Resume timer (does not create an entry)" aria-label="Resume">▶</button>
                            )}
                          </span>
                          <span className="entry-customer">{t.customer}</span>
                          <span className={`entry-duration ${showEntryDuration ? '' : 'entry-timer-live'}`}>
                            {showEntryDuration ? formatDuration(entry!.durationMinutes) : durationStr}
                          </span>
                          {(entry?.notes ?? t.notes) && (() => {
                            const notesHtml = entry?.notes ?? t.notes ?? ''
                            const notesId = t.entryId ?? t.id
                            const long = isNotesLong(notesHtml)
                            const expanded = expandedNotesIds.has(notesId)
                            if (!long) {
                              return (
                                <span className="entry-notes">
                                  <NotesContent html={notesHtml} />
                                </span>
                              )
                            }
                            return (
                              <>
                                <span className={expanded ? 'entry-notes entry-notes-expanded' : 'entry-notes entry-notes-collapsed'}>
                                  {expanded ? (
                                    <NotesContent html={notesHtml} />
                                  ) : (
                                    <span className="entry-notes-preview">
                                      {stripHtmlForPreview(notesHtml).slice(0, NOTES_PREVIEW_MAX_LEN)}
                                      {stripHtmlForPreview(notesHtml).length > NOTES_PREVIEW_MAX_LEN ? '…' : ''}
                                    </span>
                                  )}
                                </span>
                                <span className="entry-notes-toggle-wrap">
                                  <button
                                    type="button"
                                    className="entry-notes-toggle"
                                    onClick={(ev) => { ev.stopPropagation(); toggleNotesExpanded(notesId) }}
                                    aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
                                  >
                                    <FontAwesomeIcon icon={expanded ? faAngleUp : faAngleDown} />
                                  </button>
                                </span>
                              </>
                            )
                          })()}
                          {entry && (
                            <span className="entry-date entry-date-end">{formatEntryRowDate(entry.date)}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                <ul>
                  {entriesForDisplay
                    .filter((e) => !activeTimersForFocusDate.some((t) => t.entryId === e.id))
                    .map((e) => {
                      const pausedMatch = activeTimersForFocusDate.find(
                        (t) =>
                          t.status === 'paused' &&
                          !t.entryId &&
                          t.customer === e.customer &&
                          (t.notes ?? '') === (e.notes ?? '')
                      )
                      const canResume = !!pausedMatch
                      return (
                        <li key={e.id} className="entry-row-clickable">
                          <span className="entry-actions entry-actions-left" onClick={(ev) => ev.stopPropagation()}>
                            {canResume ? (
                              <button
                                type="button"
                                className="entry-btn-resume"
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  if (pausedMatch) {
                                    timer.updateTimer(pausedMatch.id, { entryId: e.id })
                                    timer.resume(pausedMatch.id)
                                  }
                                }}
                                title="Resume timer (does not create an entry)"
                                aria-label="Resume timer"
                              >
                                ▶
                              </button>
                            ) : (
                              <span className="entry-actions-placeholder" aria-hidden />
                            )}
                          </span>
                          <div
                            className="entry-row-content"
                            onClick={() => setEntryModalId(e.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault()
                                setEntryModalId(e.id)
                              }
                            }}
                          >
                            <span className="entry-customer">{e.customer}</span>
                            <span className="entry-duration">
                              {formatDuration(e.durationMinutes)}
                            </span>
                            {e.notes && (() => {
                              const notesHtml = e.notes
                              const long = isNotesLong(notesHtml)
                              const expanded = expandedNotesIds.has(e.id)
                              if (!long) {
                                return (
                                  <span className="entry-notes">
                                    <NotesContent html={notesHtml} />
                                  </span>
                                )
                              }
                              return (
                                <span className={expanded ? 'entry-notes entry-notes-expanded' : 'entry-notes entry-notes-collapsed'}>
                                  {expanded ? (
                                    <NotesContent html={notesHtml} />
                                  ) : (
                                    <span className="entry-notes-preview">
                                      {stripHtmlForPreview(notesHtml).slice(0, NOTES_PREVIEW_MAX_LEN)}
                                      {stripHtmlForPreview(notesHtml).length > NOTES_PREVIEW_MAX_LEN ? '…' : ''}
                                    </span>
                                  )}
                                </span>
                              )
                            })()}
                            <span className="entry-date entry-date-end">{formatEntryRowDate(e.date)}</span>
                          </div>
                          {e.notes && isNotesLong(e.notes) && (
                            <span className="entry-notes-toggle-wrap">
                              <button
                                type="button"
                                className="entry-notes-toggle"
                                onClick={(ev) => { ev.stopPropagation(); toggleNotesExpanded(e.id) }}
                                aria-label={expandedNotesIds.has(e.id) ? 'Collapse notes' : 'Expand notes'}
                              >
                                <FontAwesomeIcon icon={expandedNotesIds.has(e.id) ? faAngleUp : faAngleDown} />
                              </button>
                            </span>
                          )}
                        </li>
                      )
                    })}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
      {entryModalId && (() => {
        const entry = entries.find((x) => x.id === entryModalId) ?? entryModalFetched
        return entry ? (
          <EntryEditModal
            entry={entry}
            focusDate={focusDate}
            customerNames={customers}
            onCreateCustomer={handleCreateCustomer}
            onSave={(updates) => handleUpdate(entry.id, updates)}
            onClose={() => {
              setEntryModalId(null)
              setEntryModalFetched(null)
            }}
            onDelete={() => handleDelete(entry.id)}
            rounding={getRoundingPreference()}
          />
        ) : null
      })()}
    </div>
  )
}
