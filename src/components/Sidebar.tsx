import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useShowThemeToggle } from '@/context/ShowThemeToggleContext'
import './Sidebar.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/customers', label: 'Customers' },
]

interface SidebarProps {
  todayHours?: number
  weekHours?: number
}

export function Sidebar({ todayHours = 0, weekHours = 0 }: SidebarProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
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
            <button
              type="button"
              className="app-sidebar-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
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
