import { useEffect } from 'react'

export default function useCloseOnOutsideClick(callback, ignoreSelectors = []) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest) {
        for (const sel of ignoreSelectors) {
          if (!sel) continue
          if (e.target.closest(sel)) return
        }
      }
      callback && callback()
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [callback, JSON.stringify(ignoreSelectors)])
}
