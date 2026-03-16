import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { TimerProvider } from '@/context/TimerContext'
import { TimeTotalsInvalidatorProvider } from '@/context/TimeTotalsInvalidatorContext'
import { initFlags } from '@/lib/flags'
import { evaluateFlag } from '@/lib/flags'
import { buildLaunchDarklyContext } from '@/lib/launchDarklyContext'
import { setLaunchDarklyClient } from '@/lib/launchDarklyEvents'
import { Header } from '@/components/Header'
import { AppLayout } from '@/components/AppLayout'
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
    if (!ldClient) return
    setLaunchDarklyClient(ldClient)
    ldClient.identify(buildLaunchDarklyContext(user))
  }, [ldClient, user])
  return null
}

function AppContent() {
  const { user } = useSession()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const assistantEnabled = evaluateFlag('assistantEnabled', false, {
    userId: user?.id,
  }) as boolean

  useEffect(() => {
    if (!assistantEnabled) setAssistantOpen(false)
  }, [assistantEnabled])

  if (user == null) {
    return <LoginPage />
  }

  return (
    <>
      <Header />
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
