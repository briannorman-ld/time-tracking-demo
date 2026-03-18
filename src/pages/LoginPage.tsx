import { useState, useRef, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { getAllUsers, getDemoUserByUsername, createUser } from '@/lib/userStore'
import type { DemoUser } from '@/types/user'
import './LoginPage.css'

export function LoginPage() {
  const { login, setUser } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [createUsername, setCreateUsername] = useState('')
  const [createDisplayName, setCreateDisplayName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const users = getAllUsers()
  const filteredUsers = username.trim()
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(username.toLowerCase()) ||
          u.displayName.toLowerCase().includes(username.toLowerCase()) ||
          u.email.toLowerCase().includes(username.toLowerCase())
      )
    : users

  const selectedUser: DemoUser | null =
    username.trim() && users.length > 0
      ? getDemoUserByUsername(username) ?? users.find((u) => u.username === username) ?? null
      : null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = username.trim()
    const user =
      getDemoUserByUsername(trimmed) ??
      users.find(
        (u) =>
          u.username === trimmed ||
          u.displayName.toLowerCase() === trimmed.toLowerCase() ||
          u.email.toLowerCase() === trimmed.toLowerCase()
      )
    if (user) {
      login(user.id)
    }
  }

  const handleSelectUser = (u: DemoUser) => {
    setUsername(u.username)
    setShowDropdown(false)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    try {
      const newUser = createUser({
        username: createUsername.trim(),
        displayName: createDisplayName.trim() || createUsername.trim(),
        email: createEmail.trim() || `${createUsername.trim()}@demo.local`,
      })
      setUser(newUser)
      setShowCreateAccount(false)
      setCreateUsername('')
      setCreateDisplayName('')
      setCreateEmail('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create account')
    }
  }

  if (showCreateAccount) {
    return (
      <div className="login-page">
        <h1>Create account</h1>
        <p className="login-subtitle">Add a new demo user</p>
        <form className="login-form" onSubmit={handleCreateSubmit}>
          <label className="login-label">
            Username
            <input
              type="text"
              className="login-input"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="e.g. jsmith"
              required
              autoComplete="username"
            />
          </label>
          <label className="login-label">
            Display name
            <input
              type="text"
              className="login-input"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
              placeholder="e.g. Jane Smith"
              autoComplete="name"
            />
          </label>
          <label className="login-label">
            Email
            <input
              type="email"
              className="login-input"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
              autoComplete="email"
            />
          </label>
          {createError && <p className="login-error" role="alert">{createError}</p>}
          <div className="login-actions">
            <button type="submit" className="login-btn login-btn-primary">
              Create account
            </button>
            <button
              type="button"
              className="login-btn login-btn-secondary"
              onClick={() => {
                setShowCreateAccount(false)
                setCreateError(null)
              }}
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="login-page">
      <h1>Time Tracker 3000</h1>
      <p className="login-subtitle">Sign in with your account</p>
      <form className="login-form" onSubmit={handleLoginSubmit}>
        <div className="login-combobox" ref={dropdownRef}>
          <label className="login-label">
            Username
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onClick={() => setShowDropdown(true)}
              placeholder="Click to choose a user"
              autoComplete="username"
              aria-expanded={showDropdown}
              aria-controls="login-user-list"
              aria-autocomplete="list"
            />
          </label>
          {showDropdown && (
            <ul id="login-user-list" className="login-user-list login-user-dropdown" role="listbox">
              {filteredUsers.length === 0 ? (
                <li className="login-user-dropdown-empty">No users match</li>
              ) : (
                filteredUsers.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="login-user-btn"
                      role="option"
                      aria-selected={selectedUser?.id === u.id}
                      onClick={() => handleSelectUser(u)}
                    >
                      <span className="login-user-name">{u.displayName}</span>
                      <span className="login-user-meta">{u.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <label className="login-label">
          Password
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Any password works"
            autoComplete="current-password"
          />
        </label>
        <div className="login-actions">
          <button
            type="submit"
            className="login-btn login-btn-primary"
            disabled={!username.trim()}
          >
            Log in
          </button>
        </div>
      </form>
      <p className="login-create-link">
        <button
          type="button"
          className="login-link"
          onClick={() => setShowCreateAccount(true)}
        >
          Create a new account
        </button>
      </p>
    </div>
  )
}
