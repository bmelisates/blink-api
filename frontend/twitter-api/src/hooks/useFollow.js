import { useEffect, useState } from 'react'
import { FOLLOW_CHANGED, fetchFollowStats, isFollowPending } from '../services/follow'

export function useFollow(userId) {
  const [state, setState] = useState({})
  const key = String(userId ?? '')
  useEffect(() => {
    if (!userId) return
    let controller
    function refresh() {
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      setState(previous => ({ key, stats: previous.key === key ? previous.stats : undefined,
        loading: true, pending: isFollowPending(userId) }))
      fetchFollowStats(userId, signal)
        .then(stats => {
          if (!signal.aborted) setState({ key, stats, pending: isFollowPending(userId) })
        })
        .catch(() => {
          if (!signal.aborted) setState({ key, error: true, pending: isFollowPending(userId) })
        })
    }
    refresh()
    window.addEventListener(FOLLOW_CHANGED, refresh)
    return () => {
      controller?.abort()
      window.removeEventListener(FOLLOW_CHANGED, refresh)
    }
  }, [userId, key])
  return state.key === key ? state : { loading: true }
}
