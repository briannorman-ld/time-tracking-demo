import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/context/SessionContext'
import { useLdUserKeyOverride } from '@/context/LdUserKeyOverrideContext'
import { useTimeTotalsInvalidate } from '@/context/TimeTotalsInvalidatorContext'
import { useTimer } from '@/context/TimerContext'
import { useDashboardFocusDate } from '@/context/DashboardFocusDateContext'
import { buildLaunchDarklyContext } from '@/lib/launchDarklyContext'
import {
  getRecentLaunchDarklyEvents,
  type LaunchDarklyEventLogEntry,
} from '@/lib/launchDarklyEvents'
import { seedLdDemoTimeEntries } from '@/lib/seedLdDemoTimeEntries'
import { formatDisplayDate } from '@/utils/dateFormat'
import './LDAdminToolsPanel.css'

function randomUserKey(): string {
  return `user-${Math.random().toString(36).slice(2, 10)}`
}

interface LDAdminToolsPanelProps {
  onClose: () => void
}

export function LDAdminToolsPanel({ onClose }: LDAdminToolsPanelProps) {
  const { user } = useSession()
  const ldOverride = useLdUserKeyOverride()
  const invalidateTotals = useTimeTotalsInvalidate()
  const { addPausedTimer } = useTimer()
  const { focusDate } = useDashboardFocusDate()
  const [events, setEvents] = useState<LaunchDarklyEventLogEntry[]>([])
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const seedingRef = useRef(false)

  const context = buildLaunchDarklyContext(user ?? null, ldOverride?.userKeyOverride ?? null)

  const handleSeedTimeEntries = useCallback(async () => {
    if (!user || seedingRef.current) return
    seedingRef.current = true
    setSeeding(true)
    setSeedMessage(null)
    try {
      const count = await seedLdDemoTimeEntries(user.id, {
        date: focusDate,
        registerAsPausedTimer: (entry) => addPausedTimer(entry),
      })
      setSeedMessage(
        `Added ${count} time entries for ${formatDisplayDate(focusDate)}.`
      )
      invalidateTotals?.()
    } catch (e) {
      setSeedMessage(e instanceof Error ? e.message : 'Could not seed entries.')
    } finally {
      seedingRef.current = false
      setSeeding(false)
    }
  }, [user, invalidateTotals, focusDate, addPausedTimer])

  useEffect(() => {
    setEvents(getRecentLaunchDarklyEvents(50))
    const interval = setInterval(
      () => setEvents(getRecentLaunchDarklyEvents(50)),
      1500
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ld-admin-backdrop" onClick={onClose}>
      <div
        className="ld-admin-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="LaunchDarkly Admin Tools"
      >
        <div className="ld-admin-header">
          <h2>LD Admin Tools</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ld-admin-body">
          <section className="ld-admin-section">
            <h3>Current context</h3>
            <p className="ld-admin-hint">
              User + device context sent to LaunchDarkly (identify).
            </p>
            {ldOverride && (
              <div className="ld-admin-user-key-actions">
                <button
                  type="button"
                  className="ld-admin-btn"
                  onClick={() => ldOverride.setUserKeyOverride(randomUserKey())}
                >
                  Randomize user key
                </button>
                {ldOverride.userKeyOverride !== null && (
                  <button
                    type="button"
                    className="ld-admin-btn ld-admin-btn-secondary"
                    onClick={() => ldOverride.setUserKeyOverride(null)}
                  >
                    Use real user
                  </button>
                )}
              </div>
            )}
            <pre className="ld-admin-json">
              {JSON.stringify(context, null, 2)}
            </pre>
          </section>
          <section className="ld-admin-section">
            <h3>Event log</h3>
            <p className="ld-admin-hint">
              Recent <code>track()</code> events (newest first).
            </p>
            <ol className="ld-admin-events-list">
              {events.length === 0 ? (
                <li className="ld-admin-event-item empty">No events yet.</li>
              ) : (
                events.map((e, i) => (
                  <li key={`${e.ts}-${e.eventKey}-${i}`} className="ld-admin-event-item">
                    <span className="ld-admin-event-ts">{e.ts}</span>
                    <code className="ld-admin-event-key">{e.eventKey}</code>
                    {e.sent ? (
                      <span className="ld-admin-event-sent" title="Sent to LD">✓</span>
                    ) : e.deduped ? (
                      <span className="ld-admin-event-deduped" title="Deduped (not sent)">⊘</span>
                    ) : (
                      <span className="ld-admin-event-not-sent" title="Client not set">−</span>
                    )}
                    {(e.data != null && Object.keys(e.data).length > 0) || e.metricValue != null ? (
                      <pre className="ld-admin-event-payload">
                        {JSON.stringify(
                          {
                            ...(e.data ?? {}),
                            ...(e.metricValue !== undefined ? { metricValue: e.metricValue } : {}),
                          },
                          null,
                          2
                        )}
                      </pre>
                    ) : null}
                  </li>
                ))
              )}
            </ol>
          </section>
        </div>
        <div className="ld-admin-footer">
          <button
            type="button"
            className="ld-admin-btn ld-admin-btn-seed"
            disabled={!user || seeding}
            onClick={handleSeedTimeEntries}
          >
            {seeding ? 'Seeding…' : 'Seed time entries'}
          </button>
          {seedMessage ? <p className="ld-admin-seed-message">{seedMessage}</p> : null}
        </div>
      </div>
    </div>
  )
}
