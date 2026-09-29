import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH, passwordError } from '../passwordPolicy'

// Same cases as the backend's PasswordPolicyTest: the browser and the server must agree.
describe('passwordError', () => {
  it('accepts a reasonable password', () => {
    expect(passwordError('Sunrise2026x', 'ron')).toBe('')
  })
  it('rejects short passwords', () => {
    expect(passwordError('a1b2c3')).toContain(String(MIN_PASSWORD_LENGTH))
    expect(passwordError('')).not.toBe('')
    expect(passwordError(undefined)).not.toBe('')
  })
  it('needs a letter and a number', () => {
    expect(passwordError('onlyletters')).toContain('letter and one number')
    expect(passwordError('123456789012')).toContain('letter and one number')
  })
  it('rejects common passwords in any case', () => {
    expect(passwordError('Password123')).toContain('too common')
    expect(passwordError('12345678')).not.toBe('')
  })
  it('rejects passwords containing the username', () => {
    expect(passwordError('Kwame2026!', 'kwame')).toContain('username')
    expect(passwordError('Sunrise2026!', 'kwame')).toBe('')
  })
  it('ignores very short usernames', () => {
    expect(passwordError('Sunrise2026!', 'ab')).toBe('')
  })
})
