import { createContext, useContext, useEffect, useState } from 'react'

const TimeContext = createContext(Date.now())

export function TimeProvider({ children }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => clearInterval(intervalId)
  }, [])

  return <TimeContext.Provider value={currentTime}>{children}</TimeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrentTime = () => useContext(TimeContext)
