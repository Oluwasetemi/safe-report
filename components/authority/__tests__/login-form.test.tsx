import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

describe('LoginForm', () => {
  it('renders email and password fields', async () => {
    const { LoginForm } = await import('../login-form')
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/password/i)).toBeDefined()
  })

  it('submit button is disabled when fields are empty', async () => {
    const { LoginForm } = await import('../login-form')
    render(<LoginForm />)
    const btn = screen.getByRole('button', { name: /sign in/i })
    expect(btn).toHaveAttribute('disabled')
  })
})
