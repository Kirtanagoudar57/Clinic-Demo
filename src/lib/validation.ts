/** Indian mobile: 10 digits starting 6–9, optionally prefixed by +91, 91 or 0. */
export function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, '').replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export function formatMobile(digits: string): string {
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function isValidName(name: string): boolean {
  const n = name.trim()
  return n.length >= 2 && n.length <= 80 && /^[\p{L}\s.'-]+$/u.test(n)
}
