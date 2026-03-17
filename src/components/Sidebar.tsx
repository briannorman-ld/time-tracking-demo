import { Link, useLocation } from 'react-router-dom'
import type { Theme } from '@/context/ThemeContext'
import { useTheme } from '@/context/ThemeContext'
import { useShowThemeToggle } from '@/context/ShowThemeToggleContext'
import './Sidebar.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/customers', label: 'Customers' },
]

const THEME_LABELS: Record<Theme, string> = {
  light: '☀️ Light',
  dark: '🌙 Dark',
  psychedelic: '🌈 Psychedelic',
}

interface SidebarProps {
  todayHours?: number
  weekHours?: number
}

const THEMES: Theme[] = ['light', 'dark', 'psychedelic']

export function Sidebar({ todayHours = 0, weekHours = 0 }: SidebarProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const showThemeToggle = useShowThemeToggle()

  return (
    <aside className="app-sidebar">
      <nav className="app-sidebar-nav">
        {NAV.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={
              location.pathname === to
                ? 'app-sidebar-link active'
                : 'app-sidebar-link'
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="app-sidebar-footer">
        {showThemeToggle && (
          <div className="app-sidebar-theme-section">
            <div className="app-sidebar-theme-options" role="group" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`app-sidebar-theme-toggle${theme === t ? ' active' : ''}`}
                  onClick={() => setTheme(t)}
                  aria-label={`${t} mode`}
                  aria-pressed={theme === t}
                  title={`${t} mode`}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="app-sidebar-totals">
          <div className="app-sidebar-total">
            <span className="app-sidebar-total-label">Today</span>
            <span className="app-sidebar-total-value">{formatHrs(todayHours)}</span>
          </div>
          <div className="app-sidebar-total">
            <span className="app-sidebar-total-label">This week</span>
            <span className="app-sidebar-total-value">{formatHrs(weekHours)}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function formatHrs(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m > 0 ? `${h}h ${m}m` : `${h} hrs`
  }
  return `${Math.round(minutes)} min`
}
