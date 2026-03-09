import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { TimerProvider } from '@/context/TimerContext'
import { TimeTotalsInvalidatorProvider } from '@/context/TimeTotalsInvalidatorContext'
import { initFlags } from '@/lib/flags'
import { evaluateFlag } from '@/lib/flags'
import { Header } from '@/components/Header'
import { AppLayout } from '@/components/AppLayout'
import { ChatAssistant } from '@/components/ChatAssistant/ChatAssistant'
import { LoginPage } from '@/pages/LoginPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TimeEntries } from '@/components/TimeEntries/TimeEntries'

initFlags()

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
          <Route element={<AppLayout />}>
            <Route index element={<TimeEntries />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
        <TimerProvider>
          <TimeTotalsInvalidatorProvider>
            <AppContent />
          </TimeTotalsInvalidatorProvider>
        </TimerProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
