const SESSION_CHANGED = 'blink:session-changed'

export const getSessionToken = () => localStorage.getItem('token')

export function getActiveSessionToken() {
  const token = getSessionToken()
  return tokenExpiresAt(token) > Date.now() ? token : null
}

export function tokenExpiresAt(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
    if (claims.type !== 'access-v2' || !/^\d+$/.test(claims.sub) || !Number.isFinite(claims.exp)) return 0
    return claims.exp * 1000
  } catch { return 0 }
}

export function clearSession(expectedToken) {
  if (expectedToken !== undefined && getSessionToken() !== expectedToken) return
  for (const key of ['token', 'userId', 'username']) localStorage.removeItem(key)
  window.dispatchEvent(new Event(SESSION_CHANGED))
}

export function saveSession({ token, userId, username }) {
  localStorage.setItem('userId', String(userId))
  localStorage.setItem('username', username)
  localStorage.setItem('token', token)
  window.dispatchEvent(new Event(SESSION_CHANGED))
}

export function subscribeSession(callback) {
  window.addEventListener(SESSION_CHANGED, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(SESSION_CHANGED, callback)
    window.removeEventListener('storage', callback)
  }
}
