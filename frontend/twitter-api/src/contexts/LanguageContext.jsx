import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const LanguageContext = createContext()

// This module intentionally colocates the context hook and its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr'
  })

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }, [])

  const value = useMemo(() => ({ language, changeLanguage }), [language, changeLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
