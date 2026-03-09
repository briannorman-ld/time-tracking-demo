import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import Observability from '@launchdarkly/observability'
import SessionReplay from '@launchdarkly/session-replay'
import { ThemeProvider } from '@/context/ThemeContext'
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
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LDProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LDProvider>
    </StrictMode>
  )
}

init()
