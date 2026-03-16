import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLDClient, useFlags } from 'launchdarkly-react-client-sdk'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { TimerProvider } from '@/context/TimerContext'
import { TimeTotalsInvalidatorProvider } from '@/context/TimeTotalsInvalidatorContext'
import { initFlags, setFlagsLdClient } from '@/lib/flags'
import { buildLaunchDarklyContext } from '@/lib/launchDarklyContext'
import { setLaunchDarklyClient } from '@/lib/launchDarklyEvents'
import { Header } from '@/components/Header'
import { AppLayout } from '@/components/AppLayout'
import { LDAdminToolsPanel } from '@/components/LDAdminTools/LDAdminToolsPanel'
import { ChatAssistant } from '@/components/ChatAssistant/ChatAssistant'
import { LoginPage } from '@/pages/LoginPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TimeEntries } from '@/components/TimeEntries/TimeEntries'

initFlags()

/** Updates LaunchDarkly context when the logged-in user changes. Uses multi-kind context (user + device). */
function LDIdentify() {
  const ldClient = useLDClient()
  const { user } = useSession()
  useEffect(() => {
    setFlagsLdClient(ldClient ?? null)
    setLaunchDarklyClient(ldClient ?? null)
    if (!ldClient) return
    ldClient.identify(buildLaunchDarklyContext(user))
  }, [ldClient, user])
  return null
}

/** Read a boolean flag from useFlags(); supports camelCase (showLdAdminTools) or kebab (show-ld-admin-tools). */
function flagBool(flags: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
  const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const v = flags[camel] ?? flags[key]
  return typeof v === 'boolean' ? v : defaultValue
}

function AppContent() {
  const { user } = useSession()
  const flags = useFlags()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [ldAdminOpen, setLdAdminOpen] = useState(false)
  const assistantEnabled = flagBool(flags, 'assistantEnabled', false)
  const showLdAdminTools = flagBool(flags, 'show-ld-admin-tools', false)

  useEffect(() => {
    if (!assistantEnabled) setAssistantOpen(false)
  }, [assistantEnabled])

  useEffect(() => {
    if (!showLdAdminTools) setLdAdminOpen(false)
  }, [showLdAdminTools])

  if (user == null) {
    return <LoginPage />
  }

  return (
    <>
      <Header onOpenLDAdmin={showLdAdminTools ? () => setLdAdminOpen(true) : undefined} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<TimeEntries />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </main>
          {assistantEnabled && (
        <>
          {!assistantOpen && (
            <button
              type="button"
              className="assistant-fab"
              onClick={() => setAssistantOpen(true)}
              aria-label="Open assistant"
            >
              Chat
            </button>
          )}
          {assistantOpen && (
            <div className="assistant-overlay">
              <ChatAssistant onClose={() => setAssistantOpen(false)} />
            </div>
          )}
        </>
      )}
      {showLdAdminTools && ldAdminOpen && (
        <LDAdminToolsPanel onClose={() => setLdAdminOpen(false)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <LDIdentify />
        <TimerProvider>
          <TimeTotalsInvalidatorProvider>
            <AppContent />
          </TimeTotalsInvalidatorProvider>
        </TimerProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
