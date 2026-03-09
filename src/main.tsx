import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
import App from './App'
import './App.css'

const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID ?? ''

async function init() {
  const LDProvider = await asyncWithLDProvider({
    clientSideID,
    // context: {
    //   "kind": "user",
    //   "key": "example-user-key",
    //   "name": "Sandy Smith",
    //   "email": "sandy@example.com"
    // },
    options: {
      // the observability plugins require React Web SDK v3.7+
      plugins: [
        new Observability(),
        new SessionReplay()
      ],
      // other options...
    }
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LDProvider>
        <App />
      </LDProvider>
    </StrictMode>
  )
}

init()