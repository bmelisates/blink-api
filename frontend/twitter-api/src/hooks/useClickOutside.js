import { useEffect, useRef } from 'react'

export default function useClickOutside(callback) {
  const containerRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handlePointerDown = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        callbackRef.current?.()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return containerRef
}
