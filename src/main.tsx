import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import Observability from '@launchdarkly/observability'
import SessionReplay from '@launchdarkly/session-replay'
import { buildLaunchDarklyContext } from '@/lib/launchDarklyContext'
import App from './App'
import './App.css'

const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID ?? ''

async function init() {
  const LDProvider = await asyncWithLDProvider({
    clientSideID,
    context: buildLaunchDarklyContext(null),
    options: {
      plugins: [new Observability(), new SessionReplay()],
    },
    // Avoid millions of evaluations: TimeEntries re-renders every second when a timer runs,
    // and useFlags() would send an evaluation on each read. We only need evaluations at init/change.
    reactOptions: { sendEventsOnFlagRead: false },
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LDProvider>
        <App />
      </LDProvider>
    </StrictMode>
  )
}

init()
