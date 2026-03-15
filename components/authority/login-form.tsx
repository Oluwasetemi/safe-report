'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid credentials. Only pre-authorised accounts can access this portal.')
      setLoading(false)
      return
    }

    router.push('/authority/queue')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: 1, marginBottom: 6 }}>
          EMAIL
        </label>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14 }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: 1, marginBottom: 6 }}>
          PASSWORD
        </label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14 }}
        />
      </div>
      {error && (
        <p style={{ color: 'var(--severity-critical)', fontSize: 13, margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={!email || !password || loading}
        style={{
          padding:      '14px',
          background:   (!email || !password || loading) ? 'var(--border)' : 'var(--brand-primary)',
          color:        '#0A0A0A',
          border:       'none',
          borderRadius:  8,
          fontFamily:   'var(--font-barlow-condensed)',
          fontWeight:    700,
          fontSize:      16,
          cursor:        (!email || !password || loading) ? 'not-allowed' : 'pointer',
          letterSpacing:  1,
        }}
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>
    </form>
  )
}
