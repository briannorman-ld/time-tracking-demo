import { useSession } from '@/context/SessionContext'
import { DEMO_USERS } from '@/seed/seedUsers'
import './LoginPage.css'

export function LoginPage() {
  const { login } = useSession()

  return (
    <div className="login-page">
      <h1>Time Tracker Demo</h1>
      <p className="login-subtitle">Choose a demo user (passwordless)</p>
      <ul className="login-user-list">
        {DEMO_USERS.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              className="login-user-btn"
              onClick={() => login(u.id)}
            >
              <span className="login-user-name">{u.displayName}</span>
              <span className="login-user-meta">{u.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
