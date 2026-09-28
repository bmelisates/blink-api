import { Fragment, useEffect, useSyncExternalStore } from 'react'
import { Navigate } from 'react-router-dom'
import { clearSession, getSessionToken, getActiveSessionToken, subscribeSession, tokenExpiresAt } from '../services/session'

export default function ProtectedRoute({ children }) {
  const token = useSyncExternalStore(subscribeSession, getActiveSessionToken)
  const expiresAt = tokenExpiresAt(token)
  useEffect(() => {
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      const stored = getSessionToken()
      if (tokenExpiresAt(stored) <= Date.now()) clearSession(stored)
      return
    }
    const timer = setTimeout(() => clearSession(token), Math.min(remaining, 2147483647))
    return () => clearTimeout(timer)
  }, [token, expiresAt])
  // İstemci kontrolü yalnızca ekranı yönetir; gerçek doğrulama backend'dedir.
  if (!token) return <Navigate to="/login" replace />
  return <Fragment key={token}>{children}</Fragment>
}
