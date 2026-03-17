import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useShowThemeToggle } from '@/context/ShowThemeToggleContext'

const THEME_KEY = 'time-tracker-demo-theme'

export type Theme = 'light' | 'dark' | 'psychedelic'

const THEMES: Theme[] = ['light', 'dark', 'psychedelic']

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'psychedelic') return raw
  } catch {
    // ignore
  }
  return 'light'
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const showThemeToggle = useShowThemeToggle()
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = loadTheme()
    applyTheme(t)
    return t
  })

  const effectiveTheme = showThemeToggle ? theme : 'light'

  useEffect(() => {
    applyTheme(effectiveTheme)
    if (showThemeToggle) saveTheme(theme)
  }, [effectiveTheme, showThemeToggle, theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const i = THEMES.indexOf(prev)
      return THEMES[(i + 1) % THEMES.length]
    })
  }, [])

  const value = useMemo(
    () => ({ theme: effectiveTheme, setTheme, toggleTheme }),
    [effectiveTheme, setTheme, toggleTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
