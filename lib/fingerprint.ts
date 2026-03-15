import { createHash } from 'crypto'

export function hashFingerprint(raw: string, salt: string): string {
  return createHash('sha256').update(raw + salt).digest('hex')
}
