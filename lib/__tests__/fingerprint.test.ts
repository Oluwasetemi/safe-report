import { describe, it, expect } from 'vitest'
import { hashFingerprint } from '../fingerprint'

describe('hashFingerprint', () => {
  it('returns a 64-character hex string', () => {
    const result = hashFingerprint('raw-fingerprint-data', 'test-salt')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same input produces same hash', () => {
    const a = hashFingerprint('data', 'salt')
    const b = hashFingerprint('data', 'salt')
    expect(a).toBe(b)
  })

  it('different salt produces different hash', () => {
    const a = hashFingerprint('data', 'salt1')
    const b = hashFingerprint('data', 'salt2')
    expect(a).not.toBe(b)
  })
})
