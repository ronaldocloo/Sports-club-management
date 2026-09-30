// Mirrors the backend's PasswordPolicy so people get feedback before the server says no.
export const MIN_PASSWORD_LENGTH = 8

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop',
  'admin123', 'administrator', 'letmein123', 'welcome123', 'iloveyou1', 'abc12345', '11111111', '00000000',
])

// Returns an error message, or '' if the password is acceptable.
export function passwordError(password, username = '') {
  if (!password || password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.'
  const lower = password.toLowerCase()
  if (COMMON.has(lower)) return 'That password is too common. Choose something less predictable.'
  if (username && username.length >= 3 && lower.includes(username.toLowerCase())) return 'Password must not contain the username.'
  return ''
}
