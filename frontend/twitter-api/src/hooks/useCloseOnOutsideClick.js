import { useEffect, useRef } from 'react'

export default function useCloseOnOutsideClick(callback, ignoreSelectors = []) {
  const callbackRef = useRef(callback)
  const ignoreSelectorsKey = JSON.stringify(ignoreSelectors)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const selectors = JSON.parse(ignoreSelectorsKey)
    const handler = (e) => {
      if (e.target.closest) {
        for (const sel of selectors) {
          if (!sel) continue
          if (e.target.closest(sel)) return
        }
      }
      callbackRef.current?.()
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ignoreSelectorsKey])
}
