import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLDClient, useFlags } from 'launchdarkly-react-client-sdk'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { TimerProvider } from '@/context/TimerContext'
import { TimeTotalsInvalidatorProvider } from '@/context/TimeTotalsInvalidatorContext'
import { initFlags } from '@/lib/flags'
import { buildLaunchDarklyContext } from '@/lib/launchDarklyContext'
import { setLaunchDarklyClient } from '@/lib/launchDarklyEvents'
import { LdUserKeyOverrideProvider, useLdUserKeyOverride } from '@/context/LdUserKeyOverrideContext'
import { ShowThemeToggleProvider } from '@/context/ShowThemeToggleContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Header } from '@/components/Header'
import { AppLayout } from '@/components/AppLayout'
import { LDAdminToolsPanel } from '@/components/LDAdminTools/LDAdminToolsPanel'
import { LoginPage } from '@/pages/LoginPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TimeEntries } from '@/components/TimeEntries/TimeEntries'

initFlags()

/** Updates LaunchDarkly context when the logged-in user or user-key override changes. */
function LDIdentify() {
  const ldClient = useLDClient()
  const { user } = useSession()
  const ldOverride = useLdUserKeyOverride()
  const userKeyOverride = ldOverride?.userKeyOverride ?? null
  useEffect(() => {
    setLaunchDarklyClient(ldClient ?? null)
    if (!ldClient) return
    ldClient.identify(buildLaunchDarklyContext(user, userKeyOverride))
  }, [ldClient, user, userKeyOverride])
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
  const [ldAdminOpen, setLdAdminOpen] = useState(false)
  const showLdAdminTools = flagBool(flags, 'show-ld-admin-tools', false)

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
      {showLdAdminTools && ldAdminOpen && (
        <LDAdminToolsPanel onClose={() => setLdAdminOpen(false)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionProvider>
        <ShowThemeToggleProvider>
          <ThemeProvider>
            <LdUserKeyOverrideProvider>
              <LDIdentify />
              <TimerProvider>
                <TimeTotalsInvalidatorProvider>
                  <AppContent />
                </TimeTotalsInvalidatorProvider>
              </TimerProvider>
            </LdUserKeyOverrideProvider>
          </ThemeProvider>
        </ShowThemeToggleProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
