import api from './api'

export const FOLLOW_CHANGED = 'blink:follow-changed'
const pending = new Set()

export function isFollowPending(userId) {
  return pending.has(String(userId))
}

export async function changeFollow(userId, following) {
  const key = String(userId)
  if (pending.has(key)) return
  pending.add(key)
  window.dispatchEvent(new CustomEvent(FOLLOW_CHANGED, { detail: { pending: true } }))
  try {
    if (following) await api.delete(`/users/${userId}/follow`)
    else await api.post(`/users/${userId}/follow`)
  } finally {
    pending.delete(key)
    // Başarısız veya eşzamanlı isteklerden sonra da sunucudaki durumu yeniden oku.
    window.dispatchEvent(new Event(FOLLOW_CHANGED))
  }
}

export function fetchFollowStats(userId, signal) {
  return api.get(`/users/${userId}/follow-stats`, { signal }).then(response => response.data)
}

export function fetchFollowList(userId, type, page, signal) {
  return api.get(`/users/${userId}/${type}`, { params: { page, size: 20 }, signal })
    .then(response => response.data)
}
