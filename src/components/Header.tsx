import { useState } from 'react'
import { useSession } from '@/context/SessionContext'
import { getAllUsers } from '@/lib/userStore'
import './Header.css'

interface HeaderProps {
  onOpenLDAdmin?: () => void
}

export function Header({ onOpenLDAdmin }: HeaderProps) {
  const { user, setUser, logout } = useSession()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  if (!user) return null

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-header-title">Time Tracker Demo</span>
        <div className="app-header-actions">
          {onOpenLDAdmin && (
            <button
              type="button"
              className="app-header-ld-admin"
              onClick={onOpenLDAdmin}
            >
              LD Admin Tools
            </button>
          )}
            <div className="app-header-user">
              <button
                type="button"
                className="app-header-user-trigger"
                onClick={() => setSwitcherOpen((o) => !o)}
                aria-expanded={switcherOpen}
              >
                {user.displayName}
              </button>
              {switcherOpen && (
                <>
                  <div
                    className="app-header-user-backdrop"
                    onClick={() => setSwitcherOpen(false)}
                    aria-hidden
                  />
                  <div className="app-header-user-dropdown">
                    {getAllUsers().map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className={u.id === user.id ? 'app-header-user-option active' : 'app-header-user-option'}
                        onClick={() => {
                          setUser(u)
                          setSwitcherOpen(false)
                        }}
                      >
                        {u.displayName}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="app-header-user-option logout"
                      onClick={() => {
                        logout()
                        setSwitcherOpen(false)
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      </div>
    </header>
  )
}
