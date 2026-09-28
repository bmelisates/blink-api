import { useEffect, useState } from 'react'
import { getUnreadCount, MESSAGES_CHANGED } from '../services/messages'

export function useUnreadMessages() {
  const [count, setCount] = useState(null)
  useEffect(() => {
    let controller
    async function refresh() {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      try {
        const value = await getUnreadCount(signal)
        if (!signal.aborted) setCount(value)
      } catch {
        if (!signal.aborted) setCount(null)
      }
    }
    refresh()
    const timer = setInterval(refresh, 10000)
    window.addEventListener(MESSAGES_CHANGED, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      controller?.abort()
      window.removeEventListener(MESSAGES_CHANGED, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return count
}
