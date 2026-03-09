import { useState, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { userToContext } from '@/types/user'
import { getInitLogs, isInitDone } from '@/lib/flags'
import { getRecentEvents } from '@/utils/trackEvent'
import type { LoggedEvent } from '@/utils/trackEvent'
import './DemoModeDrawer.css'

interface DemoModeDrawerProps {
  onClose: () => void
}

export function DemoModeDrawer({ onClose }: DemoModeDrawerProps) {
  const { user } = useSession()
  const [tab, setTab] = useState<'context' | 'events' | 'sdk'>('context')
  const [events, setEvents] = useState<LoggedEvent[]>([])
  const [initLogs, setInitLogs] = useState<string[]>([])

  useEffect(() => {
    getRecentEvents(50).then(setEvents)
    const interval = setInterval(() => getRecentEvents(50).then(setEvents), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setInitLogs(getInitLogs())
  }, [])

  const userContext = user ? userToContext(user) : null

  return (
    <div className="demo-drawer-backdrop" onClick={onClose}>
      <div
        className="demo-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Demo Mode"
      >
        <div className="demo-drawer-header">
          <h2>Demo Mode</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <nav className="demo-drawer-tabs">
          {(['context', 'events', 'sdk'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="demo-drawer-body">
          {tab === 'context' && (
            <div className="demo-drawer-panel">
              <p>Current user context (passed to integration.identifyUser):</p>
              <pre>
                {userContext
                  ? JSON.stringify(userContext, null, 2)
                  : 'Not logged in'}
              </pre>
            </div>
          )}
          {tab === 'events' && (
            <div className="demo-drawer-panel">
              <p>Last 50 tracked events:</p>
              <ol className="demo-events-list">
                {events.map((e, i) => (
                  <li key={i} className="demo-event-item">
                    <span className="demo-event-ts">{e.ts}</span>
                    <code>{e.name}</code>
                    {e.payload != null &&
                    typeof e.payload === 'object' &&
                    Object.keys(e.payload).length > 0 ? (
                        <pre className="demo-event-payload">
                          {JSON.stringify(e.payload)}
                        </pre>
                      ) : null}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {tab === 'sdk' && (
            <div className="demo-drawer-panel">
              <p>Flags init status (stub):</p>
              <p>
                <strong>Initialized:</strong> {isInitDone() ? 'Yes' : 'No'}
              </p>
              <p>Init logs:</p>
              <pre className="demo-sdk-logs">
                {initLogs.length ? initLogs.join('\n') : 'No logs yet.'}
              </pre>
              <p className="demo-sdk-note">
                In production, this tab would show your feature-flag SDK init
                status and errors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
