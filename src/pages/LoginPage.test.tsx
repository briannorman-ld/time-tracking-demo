import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '@/pages/LoginPage'

const mockLogin = vi.fn()
const mockSetUser = vi.fn()

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    login: mockLogin,
    setUser: mockSetUser,
    user: null,
  }),
}))

const mockGetAllUsers = vi.fn()
const mockGetDemoUserByUsername = vi.fn()
const mockCreateUser = vi.fn()

vi.mock('@/lib/userStore', () => ({
  getAllUsers: () => mockGetAllUsers(),
  getDemoUserByUsername: (username: string) => mockGetDemoUserByUsername(username),
  createUser: (input: Parameters<typeof import('@/lib/userStore').createUser>[0]) =>
    mockCreateUser(input),
}))

describe('LoginPage', () => {
  const seedUsers = [
    { id: 'user-alex', username: 'alex', displayName: 'Alex', email: 'alex@demo.local' },
    { id: 'user-jen', username: 'jen', displayName: 'Jen', email: 'jen@demo.local' },
  ]

  beforeEach(() => {
    mockLogin.mockClear()
    mockSetUser.mockClear()
    mockCreateUser.mockClear()
    mockGetAllUsers.mockReturnValue(seedUsers as any)
    mockGetDemoUserByUsername.mockImplementation((username: string) => {
      const u = seedUsers.find((x) => x.username === username)
      return u ?? undefined
    })
  })

  it('renders login form with username and password', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /time tracker demo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create a new account/i })).toBeInTheDocument()
  })

  it('shows user dropdown when username input is focused', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByLabelText(/username/i))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Alex')).toBeInTheDocument()
    expect(screen.getByText('Jen')).toBeInTheDocument()
  })

  it('selecting a user from dropdown fills username and login submits', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByLabelText(/username/i))
    await user.click(screen.getByText('Alex'))
    expect(screen.getByLabelText(/username/i)).toHaveValue('alex')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockLogin).toHaveBeenCalledWith('user-alex')
  })

  it('typing username and submitting logs in when user exists', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/username/i), 'alex')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockLogin).toHaveBeenCalledWith('user-alex')
  })

  it('Log in button is disabled when username is empty', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled()
  })

  it('Create a new account shows create form', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /create a new account/i }))
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. jsmith/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
  })

  it('Create account form submits and sets user', async () => {
    const newUser = {
      id: 'user-new',
      username: 'newuser',
      displayName: 'New User',
      email: 'new@demo.local',
    }
    mockCreateUser.mockReturnValue(newUser)
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /create a new account/i }))
    await user.type(screen.getByPlaceholderText(/e.g. jsmith/i), 'newuser')
    await user.type(screen.getByPlaceholderText(/e.g. jane smith/i), 'New User')
    await user.type(screen.getByPlaceholderText(/e.g. jane@example/i), 'new@demo.local')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'newuser',
      displayName: 'New User',
      email: 'new@demo.local',
    })
    expect(mockSetUser).toHaveBeenCalledWith(newUser)
  })

  it('Create account shows error when username taken', async () => {
    mockCreateUser.mockImplementation(() => {
      throw new Error('Username "taken" is already taken')
    })
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /create a new account/i }))
    await user.type(screen.getByPlaceholderText(/e.g. jsmith/i), 'taken')
    await user.type(screen.getByPlaceholderText(/e.g. jane smith/i), 'Taken User')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/already taken/)
  })
})
