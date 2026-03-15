import { describe, it, expect } from 'vitest'

// Middleware logic: if path starts with /authority and no session → redirect
describe('Authority route protection', () => {
  it('identifies authority routes correctly', () => {
    const isAuthorityRoute = (path: string) => path.startsWith('/authority')
    expect(isAuthorityRoute('/authority/queue')).toBe(true)
    expect(isAuthorityRoute('/authority/login')).toBe(true)
    expect(isAuthorityRoute('/')).toBe(false)
    expect(isAuthorityRoute('/report')).toBe(false)
  })

  it('login route is not protected', () => {
    const requiresAuth = (path: string) =>
      path.startsWith('/authority') && path !== '/authority/login'
    expect(requiresAuth('/authority/queue')).toBe(true)
    expect(requiresAuth('/authority/login')).toBe(false)
  })
})
